import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { Layout } from '../../components/Layout/Layout';
import { UploadModal } from '../../components/UploadModal/UploadModal';
import { CreateFolderModal } from '../../components/CreateFolderModal/CreateFolderModal';
import { CreateFileMenu } from '../../components/CreateFileMenu/CreateFileMenu';
import { FileActionMenu } from '../../components/FileActionMenu/FileActionMenu';
import { RenameModal } from '../../components/RenameModal/RenameModal';
import { ShareModal } from '../../components/ShareModal/ShareModal';
import { TagModal } from '../../components/TagModal/TagModal';
import { saveFileContent, getFileContent, deleteFileContent, base64ToBlob } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { logActivity } from '../../services/activityLog';
import { notifySuccess, notifyError } from '../../services/notifications';
import { connectWebSocket, disconnectWebSocket, onWebSocketEvent } from '../../services/websocket';
import { openFileWithNativeApp } from '../../services/fileSync';
import { createWordDocument, createExcelSpreadsheet, createPowerPointPresentation } from '../../utils/officeFileGenerator';
import api from '../../services/api';
import './Files.scss';

export const Files = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState([{ nom: 'Mes fichiers' }]);
  const [currentFolderId, setCurrentFolderId] = useState(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [createFileMenuOpen, setCreateFileMenuOpen] = useState(false);
  const [fileActionMenu, setFileActionMenu] = useState(null);
  const [renameModal, setRenameModal] = useState({ open: false });
  const [shareModal, setShareModal] = useState({ open: false });
  const [tagModal, setTagModal] = useState({ open: false, item: null });
  const [contextMenu, setContextMenu] = useState(null);
  const createButtonRef = useRef(null);

  // Charger depuis l'API
  const [allFiles, setAllFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les fichiers depuis l'API au montage
  useEffect(() => {
    loadFiles();
    
    // Connexion WebSocket pour les mises à jour en temps réel
    if (user?.id) {
      connectWebSocket(user.id);
    }

    // S'abonner aux événements WebSocket
    const unsubscribeFileCreated = onWebSocketEvent('file_created', () => {
      loadFiles();
    });
    const unsubscribeFolderCreated = onWebSocketEvent('folder_created', () => {
      loadFiles();
    });
    const unsubscribeFileDeleted = onWebSocketEvent('file_deleted', () => {
      loadFiles();
    });
    const unsubscribeFileRenamed = onWebSocketEvent('file_renamed', () => {
      loadFiles();
    });
    const unsubscribeFileUpdated = onWebSocketEvent('file_updated', () => {
      loadFiles();
    });
    const unsubscribeFileMoved = onWebSocketEvent('file_moved', () => {
      loadFiles();
    });
    const unsubscribeFileRestored = onWebSocketEvent('file_restored', () => {
      loadFiles();
    });

    // Recharger toutes les 10 secondes en fallback
    const interval = setInterval(() => {
      loadFiles();
    }, 10000);

    return () => {
      clearInterval(interval);
      unsubscribeFileCreated();
      unsubscribeFolderCreated();
      unsubscribeFileDeleted();
      unsubscribeFileRenamed();
      unsubscribeFileUpdated();
      unsubscribeFileMoved();
      unsubscribeFileRestored();
      if (user?.id) {
        disconnectWebSocket();
      }
    };
  }, [user]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const files = await api.getFiles();
      setAllFiles(files || []);
    } catch (error) {
      notifyError(
        'Erreur de chargement',
        'Impossible de charger les fichiers',
        error?.message || 'Erreur serveur',
        'load_files'
      );
      setAllFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Écouter les événements de mise à jour pour recharger depuis l'API
  useEffect(() => {
    const handleFilesUpdate = () => {
      loadFiles();
    };

    window.addEventListener('filesUpdated', handleFilesUpdate);
    
    return () => {
      window.removeEventListener('filesUpdated', handleFilesUpdate);
    };
  }, []);

  useEffect(() => {
    // Filtrer les fichiers selon le dossier courant et exclure les fichiers supprimés
    const filtered = allFiles.filter(file => {
      // Exclure les fichiers supprimés
      if (file.estSupprime) {
        return false;
      }
      
      // Si on est à la racine (currentFolderId === undefined), montrer les fichiers sans parentId
      if (currentFolderId === undefined) {
        return file.parentId === null || file.parentId === undefined;
      }
      // Sinon, montrer les fichiers dont le parentId correspond au dossier courant
      return file.parentId === currentFolderId;
    });
    setFiles(filtered);
  }, [currentFolderId, allFiles]);

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' Go';
  };

  const handleFileClick = (file) => {
    if (file.type === 'dossier') {
      setCurrentPath([...currentPath, { nom: file.nom, id: file.id }]);
      setCurrentFolderId(file.id);
    } else {
      // Pour tous les fichiers Office et texte, télécharger et ouvrir avec l'application système
      const officeExtensions = ['docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt'];
      const textExtensions = ['txt'];
      const extension = file.extension?.toLowerCase();
      
      if (officeExtensions.includes(extension) || textExtensions.includes(extension)) {
        // Télécharger le fichier pour qu'il s'ouvre avec l'application système
        // Word pour .docx/.doc, Excel pour .xlsx/.xls, PowerPoint pour .pptx/.ppt, Notepad pour .txt
        downloadFile(file, true);
      } else {
        // Pour les autres fichiers, afficher le menu d'actions
        setFileActionMenu(file);
      }
    }
  };

  const handleBreadcrumbClick = (index) => {
    const newPath = currentPath.slice(0, index + 1);
    setCurrentPath(newPath);
    // Si on clique sur "Mes fichiers" (index 0), on revient à la racine
    if (index === 0) {
      setCurrentFolderId(undefined);
    } else {
      // Utiliser l'ID du dossier dans le chemin
      const targetFolder = newPath[index];
      setCurrentFolderId(targetFolder.id);
    }
  };

  const handleDelete = async (item) => {
    // Validation de suppression selon le cahier des charges
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer "${item.nom}" ?\n\n` +
      `Le fichier sera déplacé dans la corbeille et restera disponible pendant 1 mois.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // Supprimer via l'API
      await api.deleteFile(item.id);

      // Recharger les fichiers
      await loadFiles();

      // Le log d'activité est créé automatiquement par le backend

      // Notification de succès
      notifySuccess(
        'Fichier supprimé',
        `"${item.nom}" a été déplacé dans la corbeille`,
        'delete'
      );

      setContextMenu(null);
    } catch (error) {
      // Notification d'erreur avec cause
      notifyError(
        'Erreur de suppression',
        `Impossible de supprimer "${item.nom}"`,
        error?.message || 'Erreur serveur',
        'delete'
      );
    }
  };

  const downloadFile = async (item, openInApp = false) => {
    try {
      // Télécharger via l'API
      await api.downloadFile(item.id, item.nom);
    } catch (error) {
      notifyError(
        'Erreur de téléchargement',
        `Impossible de télécharger "${item.nom}"`,
        error?.message || 'Erreur serveur',
        'download'
      );
    }
  };

  const downloadFolder = async (folder) => {
    // Récupérer tous les fichiers du dossier et de ses sous-dossiers
      const getAllFilesInFolder = (folderId, path = '') => {
        const result = [];
      const children = allFiles.filter(f => f.parentId === folderId);
      
      for (const child of children) {
        const childPath = path ? `${path}/${child.nom}` : child.nom;
        if (child.type === 'fichier') {
          result.push({ file: child, path: childPath });
        } else if (child.type === 'dossier') {
          // Récursivement récupérer les fichiers des sous-dossiers
          result.push(...getAllFilesInFolder(child.id, childPath));
        }
      }
      return result;
    };

    const filesToZip = getAllFilesInFolder(folder.id);
    
    if (filesToZip.length === 0) {
      alert('Le dossier est vide');
      return;
    }

    const zip = new JSZip();
    
    // Ajouter tous les fichiers au ZIP
    for (const { file, path } of filesToZip) {
      const fileContent = getFileContent(file.id);
      if (fileContent) {
        // Utiliser le contenu réel stocké
        const blob = base64ToBlob(fileContent, file.mimeType);
        zip.file(path, blob);
      } else {
        // Fichier sans contenu stocké
        const content = `Contenu du fichier ${file.nom}`;
        zip.file(path, content);
      }
    }

    // Générer le ZIP et le télécharger
    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${folder.nom}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Erreur lors du téléchargement du dossier');
    }
  };

  const handleDownload = (item) => {
    if (item.type === 'fichier') {
      downloadFile(item);
    } else {
      downloadFolder(item);
    }
    setContextMenu(null);
  };

  const handleCreateOfficeFile = async (type) => {
    if (!type) {
      return;
    }

    const extensions = {
      word: 'docx',
      excel: 'xlsx',
      powerpoint: 'pptx',
      text: 'txt',
    };

    const mimeTypes = {
      word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      powerpoint: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      text: 'text/plain',
    };

    const defaultNames = {
      word: 'Nouveau document.docx',
      excel: 'Nouvelle feuille de calcul.xlsx',
      powerpoint: 'Nouvelle présentation.pptx',
      text: 'Nouveau fichier texte.txt',
    };

    // Vérifier que le type est valide
    if (!extensions[type] || !mimeTypes[type] || !defaultNames[type]) {
      return;
    }

    try {
      let file;
      
      // Créer un fichier Office valide ou un fichier texte
      if (type === 'word') {
        const blob = await createWordDocument('Document Word créé avec MonDrive');
        file = new File([blob], defaultNames[type], { type: mimeTypes[type] });
      } else if (type === 'excel') {
        const blob = await createExcelSpreadsheet();
        file = new File([blob], defaultNames[type], { type: mimeTypes[type] });
      } else if (type === 'powerpoint') {
        const blob = await createPowerPointPresentation();
        file = new File([blob], defaultNames[type], { type: mimeTypes[type] });
      } else if (type === 'text') {
        // Pour les fichiers texte, créer un simple blob
        const blob = new Blob(['Fichier texte créé avec MonDrive'], { type: mimeTypes[type] });
        file = new File([blob], defaultNames[type], { type: mimeTypes[type] });
      } else {
        throw new Error('Type de fichier non supporté');
      }
      
      // Upload via l'API avec un flag pour indiquer que c'est une création (pas un téléversement)
      const newFile = await api.uploadFile(file, currentFolderId, true); // true = isCreation

      // Recharger les fichiers
      await loadFiles();

      // Le log d'activité est créé automatiquement par le backend

      notifySuccess(
        'Fichier créé',
        `"${defaultNames[type]}" a été créé avec succès`,
        'file_creation'
      );

      // Ouvrir automatiquement le fichier avec l'application native
      try {
        // Attendre un peu pour que le fichier soit bien créé
        setTimeout(async () => {
          await openFileWithNativeApp(newFile.id, defaultNames[type]);
        }, 500);
      } catch (error) {
        // Ne pas bloquer si l'ouverture échoue
      }
    } catch (error) {
      notifyError(
        'Erreur de création',
        `Impossible de créer le fichier`,
        error?.message || 'Erreur serveur',
        'file_creation'
      );
    }
  };

  const filteredFiles = files.filter(file =>
    file.nom.toLowerCase().includes(searchQuery.toLowerCase()) && !file.estSupprime
  );

  return (
    <Layout>
      <div className="files-page">
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="create-button-container" style={{ position: 'relative' }}>
              <button 
                ref={createButtonRef}
                className="btn-create"
                onClick={() => setCreateFileMenuOpen(!createFileMenuOpen)}
              >
                +
              </button>
              {createFileMenuOpen && (
                <CreateFileMenu
                  onClose={() => setCreateFileMenuOpen(false)}
                  onCreateFile={(type) => {
                    handleCreateOfficeFile(type);
                    setCreateFileMenuOpen(false);
                  }}
                  onCreateFolder={() => {
                    setCreateFolderModalOpen(true);
                    setCreateFileMenuOpen(false);
                  }}
                  onUpload={() => {
                    setUploadModalOpen(true);
                    setCreateFileMenuOpen(false);
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="breadcrumb">
          {currentPath.map((path, index) => (
            <span key={index}>
              <button
                className="breadcrumb-link"
                onClick={() => handleBreadcrumbClick(index)}
              >
                {path.nom}
              </button>
              {index < currentPath.length - 1 && <span className="breadcrumb-separator"> / </span>}
            </span>
          ))}
        </div>

        {loading && (
          <div className="loading-state">
            <p>Chargement des fichiers...</p>
          </div>
        )}

        {!loading && (
        <div className="files-table-container">
          <table className="files-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Taille</th>
                <th>Date de modification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                    {searchQuery ? 'Aucun fichier trouvé' : 'Aucun fichier dans ce dossier'}
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file.id}>
                    <td 
                      onClick={() => handleFileClick(file)} 
                      className={`file-name ${file.type === 'fichier' ? 'file-clickable' : ''}`}
                    >
                      <span className="file-icon">{file.type === 'dossier' ? '📁' : '📄'}</span>
                      {file.nom}
                      {file.tags && file.tags.length > 0 && (
                        <span className="file-tags">
                          {file.tags.map(tag => (
                            <span key={tag} className="file-tag">🏷️ {tag}</span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td>{file.type === 'dossier' ? 'Dossier' : file.extension?.toUpperCase()}</td>
                    <td>{formatSize(file.taille)}</td>
                    <td>{new Date(file.dateModification).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <div className="actions-menu">
                        <button
                          className="action-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              item: file,
                            });
                          }}
                        >
                          ⋮
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredFiles.length === 0 && (
            <div className="empty-state">
              {searchQuery ? 'Aucun fichier trouvé' : 'Aucun fichier'}
            </div>
          )}
        </div>
        )}

        {contextMenu && (
          <>
            <div className="context-menu-overlay" onClick={() => setContextMenu(null)} />
            <div
              className="context-menu"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              {(() => {
                const item = contextMenu.item;
                const officeExtensions = ['docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt'];
                const textExtensions = ['txt'];
                const extension = item.extension?.toLowerCase();
                const canOpenInApp = officeExtensions.includes(extension) || textExtensions.includes(extension);
                
                return (
                  <>
                    {canOpenInApp && (
                      <button onClick={() => {
                        downloadFile(item, true);
                        setContextMenu(null);
                      }}>
                        📂 Ouvrir avec l'application
                      </button>
                    )}
                    <button onClick={() => handleDownload(contextMenu.item)}>
                      ⬇️ Télécharger
                    </button>
                    {(() => {
                      const editableExtensions = ['txt', 'js', 'jsx', 'ts', 'tsx', 'json', 'css', 'scss', 'html', 'xml', 'md', 'yaml', 'yml', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'sh', 'bat', 'ps1'];
                      const isEditable = editableExtensions.includes(item.extension?.toLowerCase()) || item.mimeType?.startsWith('text/');
                      
                      return isEditable && (
                        <button onClick={() => {
                          navigate(`/editor/${item.id}`);
                          setContextMenu(null);
                        }}>
                          📝 Éditer
                        </button>
                      );
                    })()}
                    <div className="menu-divider" />
                    <button onClick={() => {
                      setRenameModal({ open: true, item: contextMenu.item });
                      setContextMenu(null);
                    }}>
                      ✏️ Renommer
                    </button>
                    <button onClick={() => {
                      setShareModal({ open: true, item: contextMenu.item });
                      setContextMenu(null);
                    }}>
                      🔗 Partager
                    </button>
                    <button onClick={() => {
                      setTagModal({ open: true, item: contextMenu.item });
                      setContextMenu(null);
                    }}>
                      🏷️ Étiquetter
                    </button>
                    <button onClick={async () => {
                      try {
                        const newFavoriteStatus = !contextMenu.item.estFavori;
                        await api.updateFileMetadata(contextMenu.item.id, { estFavori: newFavoriteStatus });
                        await loadFiles(); // Recharger depuis l'API
                        setContextMenu(null);
                        notifySuccess(
                          newFavoriteStatus ? 'Ajouté aux favoris' : 'Retiré des favoris',
                          `"${contextMenu.item.nom}" ${newFavoriteStatus ? 'a été ajouté aux favoris' : 'a été retiré des favoris'}`,
                          'favorite'
                        );
                      } catch (error) {
                        notifyError(
                          'Erreur',
                          'Impossible de mettre à jour les favoris',
                          error?.message || 'Erreur serveur',
                          'favorite'
                        );
                      }
                    }}>
                      {contextMenu.item.estFavori ? '⭐ Retirer des favoris' : '⭐ Ajouter aux favoris'}
                    </button>
                    <div className="menu-divider" />
                    <button onClick={() => handleDelete(contextMenu.item)} className="danger">
                      🗑️ Supprimer
                    </button>
                  </>
                );
              })()}
            </div>
          </>
        )}

        {uploadModalOpen && (
          <UploadModal
            onClose={() => setUploadModalOpen(false)}
            onUpload={async (file) => {
              try {
                // Vérifier la taille du fichier (max 100MB)
                const maxSize = 100 * 1024 * 1024;
                if (file.size > maxSize) {
                  notifyError(
                    'Échec du téléversement',
                    `Le fichier "${file.name}" est trop volumineux`,
                    `Taille maximale autorisée : 100MB (fichier : ${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
                    'upload'
                  );
                  return;
                }

                // Upload via l'API
                const newFile = await api.uploadFile(file, currentFolderId);

                // Recharger les fichiers
                await loadFiles();

                // Le log d'activité est créé automatiquement par le backend

                // Notification de succès
                notifySuccess(
                  'Fichier téléversé',
                  `"${file.name}" a été téléversé avec succès`,
                  'upload'
                );

      setUploadModalOpen(false);
    } catch (error) {
      notifyError(
        'Échec du téléversement',
        `Impossible de téléverser "${file.name}"`,
        error?.message || 'Erreur serveur',
        'upload'
      );
    }
            }}
          />
        )}

        {createFolderModalOpen && (
          <CreateFolderModal
            onClose={() => setCreateFolderModalOpen(false)}
            onCreate={async (nom) => {
              try {
                // Créer le dossier via l'API
                const newFolder = await api.createFolder(nom, currentFolderId);

                // Recharger les fichiers
                await loadFiles();

                // Le log d'activité est créé automatiquement par le backend

                // Notification de succès
                notifySuccess(
                  'Dossier créé',
                  `Le dossier "${nom}" a été créé avec succès`,
                  'folder_creation'
                );

                setCreateFolderModalOpen(false);
              } catch (error) {
                notifyError(
                  'Erreur de création',
                  `Impossible de créer le dossier "${nom}"`,
                  error?.message || 'Erreur serveur',
                  'folder_creation'
                );
              }
            }}
          />
        )}

        {renameModal.open && renameModal.item && (
          <RenameModal
            item={renameModal.item}
            onClose={() => setRenameModal({ open: false })}
            onRename={async (newName) => {
              try {
                await api.renameFile(renameModal.item?.id || '', newName);
                await loadFiles(); // Recharger depuis l'API
                setRenameModal({ open: false });
                notifySuccess('Fichier renommé', `"${renameModal.item?.nom}" a été renommé en "${newName}"`);
              } catch (error) {
                notifyError(
                  'Erreur de renommage',
                  `Impossible de renommer "${renameModal.item?.nom}"`,
                  error?.message || 'Erreur serveur',
                  'rename'
                );
              }
            }}
          />
        )}

        {shareModal.open && shareModal.item && (
          <ShareModal
            item={shareModal.item}
            onClose={() => setShareModal({ open: false })}
          />
        )}

        {tagModal.open && tagModal.item && (
          <TagModal
            item={tagModal.item}
            onClose={() => setTagModal({ open: false, item: null })}
            onSave={async (tags) => {
              try {
                await api.updateFileMetadata(tagModal.item.id, { tags });
                await loadFiles(); // Recharger depuis l'API
                notifySuccess('Étiquettes mises à jour', 'Les étiquettes ont été modifiées');
              } catch (error) {
                notifyError(
                  'Erreur',
                  'Impossible de mettre à jour les étiquettes',
                  error?.message || 'Erreur serveur',
                  'update_tags'
                );
              }
            }}
          />
        )}

        {fileActionMenu && (
          <>
            <div className="file-action-overlay" onClick={() => setFileActionMenu(null)} />
            <FileActionMenu
              file={fileActionMenu}
              onClose={() => setFileActionMenu(null)}
              onEdit={() => navigate(`/editor/${fileActionMenu.id}`)}
            />
          </>
        )}
      </div>
    </Layout>
  );
};

