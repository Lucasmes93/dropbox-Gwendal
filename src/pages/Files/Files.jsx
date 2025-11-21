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
import { saveFileContent, getFileContent, deleteFileContent, base64ToBlob } from '../../services/storage';
import './Files.scss';

export const Files = () => {
  const navigate = useNavigate();
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
  const [contextMenu, setContextMenu] = useState(null);
  const createButtonRef = useRef(null);

  // Données mock initiales
  const getInitialFiles = ()=> [
    // Racine
    {
      id: '1',
      nom: 'Documents',
      type: 'dossier',
      dateModification: '2025-11-15',
      parentId: undefined,
    },
    {
      id: '2',
      nom: 'Images',
      type: 'dossier',
      dateModification: '2025-11-18',
      parentId: undefined,
    },
    {
      id: '3',
      nom: 'rapport.pdf',
      type: 'fichier',
      taille: 2048576,
      extension: 'pdf',
      dateModification: '2025-11-19',
      parentId: undefined,
    },
    {
      id: '4',
      nom: 'presentation.pptx',
      type: 'fichier',
      taille: 5242880,
      extension: 'pptx',
      dateModification: '2025-11-20',
      parentId: undefined,
    },
    // Contenu du dossier Documents (id: '1')
    {
      id: '5',
      nom: 'Travail',
      type: 'dossier',
      dateModification: '2025-11-16',
      parentId: '1',
    },
    {
      id: '6',
      nom: 'Personnel',
      type: 'dossier',
      dateModification: '2025-11-17',
      parentId: '1',
    },
    {
      id: '7',
      nom: 'note.txt',
      type: 'fichier',
      taille: 1024,
      extension: 'txt',
      dateModification: '2025-11-18',
      parentId: '1',
    },
    // Contenu du dossier Images (id: '2')
    {
      id: '8',
      nom: 'photo1.jpg',
      type: 'fichier',
      taille: 3145728,
      extension: 'jpg',
      dateModification: '2025-11-19',
      parentId: '2',
    },
    {
      id: '9',
      nom: 'photo2.png',
      type: 'fichier',
      taille: 2097152,
      extension: 'png',
      dateModification: '2025-11-20',
      parentId: '2',
    },
    // Contenu du dossier Travail (id: '5')
    {
      id: '10',
      nom: 'projet.docx',
      type: 'fichier',
      taille: 1536000,
      extension: 'docx',
      dateModification: '2025-11-21',
      parentId: '5',
    },
  ];

  // Charger depuis localStorage ou utiliser les données initiales
  const [allFiles, setAllFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('monDrive_files');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erreur lors du chargement depuis localStorage:', error);
    }
    return getInitialFiles();
  });

  // Sauvegarder dans localStorage à chaque modification (avec debounce pour éviter les sauvegardes trop fréquentes)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        const serialized = JSON.stringify(allFiles);
        // Vérifier la taille pour éviter les problèmes de quota
        if (serialized.length > 5 * 1024 * 1024) { // 5MB
          console.warn('Les fichiers sont très volumineux, cela peut causer des problèmes de performance');
        }
        const currentSaved = localStorage.getItem('monDrive_files');
        // Ne sauvegarder que si les données ont changé
        if (serialized !== currentSaved) {
          localStorage.setItem('monDrive_files', serialized);
          // Déclencher un événement personnalisé pour notifier les autres composants
          window.dispatchEvent(new Event('filesUpdated'));
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde dans localStorage:', error);
        // Si c'est une erreur de quota, informer l'utilisateur
        if (error.name === 'QuotaExceededError') {
          alert('L\'espace de stockage est plein. Veuillez supprimer des fichiers.');
        }
      }
    }, 300); // Debounce de 300ms pour éviter les sauvegardes trop fréquentes

    return () => clearTimeout(timeoutId);
  }, [allFiles]);

  // Écouter les mises à jour depuis d'autres pages (comme la corbeille) et la synchronisation automatique
  useEffect(() => {
    let isUpdating = false; // Éviter les boucles infinies

    const handleFilesUpdate = () => {
      if (isUpdating) return; // Éviter les mises à jour simultanées
      try {
        const saved = localStorage.getItem('monDrive_files');
        if (saved) {
          const updated = JSON.parse(saved);
          // Comparer avec l'état actuel pour éviter les re-renders inutiles
          const currentSerialized = JSON.stringify(allFiles);
          if (saved !== currentSerialized) {
            isUpdating = true;
            setAllFiles(updated);
            setTimeout(() => { isUpdating = false; }, 100);
          }
        }
      } catch (error) {
        console.error('Erreur lors du rechargement des fichiers:', error);
      }
    };

    // Écouter les événements de synchronisation automatique
    const handleDataSynced = (e) => {
      if (isUpdating) return; // Éviter les mises à jour simultanées
      const customEvent = e;
      if (customEvent.detail?.key === 'monDrive_files') {
        try {
          const updated = customEvent.detail.value;
          // Comparer avec l'état actuel pour éviter les re-renders inutiles
          const currentSerialized = JSON.stringify(allFiles);
          const updatedSerialized = JSON.stringify(updated);
          if (updatedSerialized !== currentSerialized) {
            isUpdating = true;
            setAllFiles(updated);
            setTimeout(() => { isUpdating = false; }, 100);
          }
        } catch (error) {
          console.error('Erreur lors de la synchronisation des fichiers:', error);
        }
      }
    };

    window.addEventListener('filesUpdated', handleFilesUpdate);
    window.addEventListener('dataSynced', handleDataSynced);
    
    return () => {
      window.removeEventListener('filesUpdated', handleFilesUpdate);
      window.removeEventListener('dataSynced', handleDataSynced);
    };
  }, [allFiles]); // Dépendance nécessaire pour la comparaison

  useEffect(() => {
    // Filtrer les fichiers selon le dossier courant
    const filtered = allFiles.filter(file => {
      // Si on est à la racine (currentFolderId === undefined), montrer les fichiers sans parentId
      if (currentFolderId === undefined) {
        return file.parentId === undefined;
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

  const handleDelete = (item) => {
    // Marquer comme supprimé au lieu de supprimer définitivement
    setAllFiles(prev => prev.map(f =>
      f.id === item.id ? { ...f, estSupprime: true } : f
    ));
    // Notene supprime pas le contenu du fichier pour permettre la restauration
    setContextMenu(null);
  };

  const downloadFile = (item, openInApp = false) => {
    // Récupérer le contenu réel du fichier
    const fileContent = getFileContent(item.id);
    
    if (fileContent) {
      // Utiliser le contenu stocké
      const blob = base64ToBlob(fileContent, item.mimeType);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.nom;
      
      // Pour les fichiers Office, essayer d'ouvrir avec l'application système
      if (openInApp) {
        // Créer un lien avec target="_blank" pour certains navigateurs
        link.target = '_blank';
        // Certains navigateurs ouvrent automatiquement les fichiers Office téléchargés
        // avec l'application associée si elle est configurée
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Nettoyer l'URL après un court délai pour permettre le téléchargement
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } else {
      // Fichier mock ou ancien fichier sans contenu stocké
      const content = `Contenu du fichier ${item.nom}\n\nCeci est un fichier de démonstration.`;
      const blob = new Blob([content], { type: item.mimeType || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.nom;
      if (openInApp) {
        link.target = '_blank';
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
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
        // Fichier mock ou ancien fichier sans contenu
        const content = `Contenu du fichier ${file.nom}\n\nCeci est un fichier de démonstration.`;
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
      console.error('Erreur lors de la création du ZIP:', error);
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

  const handleCreateOfficeFile = (type) => {
    if (!type) {
      console.error('Type de fichier non spécifié');
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

    const defaultContent = {
      word: 'Document Word créé avec MonDrive',
      excel: 'Feuille de calcul Excel créée avec MonDrive',
      powerpoint: 'Présentation PowerPoint créée avec MonDrive',
      text: 'Fichier texte créé avec MonDrive',
    };

    // Vérifier que le type est valide
    if (!extensions[type] || !mimeTypes[type] || !defaultNames[type] || !defaultContent[type]) {
      console.error('Type de fichier invalide:', type);
      return;
    }

    const fileId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const newFile = {
      id: fileId,
      nom: defaultNames[type],
      type: 'fichier',
      taille: defaultContent[type].length,
      dateModification: new Date().toISOString(),
      extension: extensions[type],
      parentId: currentFolderId,
      mimeType: mimeTypes[type],
      estSupprime: false,
    };

    // Créer un blob et le sauvegarder
    const blob = new Blob([defaultContent[type]], { type: mimeTypes[type] });
    const file = new File([blob], defaultNames[type], { type: mimeTypes[type] });
    
    // Ajouter le fichier immédiatement pour qu'il soit visible
    setAllFiles(prev => {
      const updated = [...prev, newFile];
      return updated;
    });
    
    // Sauvegarder le contenu en arrière-plan
    saveFileContent(fileId, file).then(() => {
      console.log('Fichier créé et sauvegardé:', newFile.nom);
    }).catch(error => {
      console.error('Erreur lors de la sauvegarde du contenu:', error);
    });
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
              {filteredFiles.map((file) => (
                <tr key={file.id}>
                  <td 
                    onClick={() => handleFileClick(file)} 
                    className={`file-name ${file.type === 'fichier' ? 'file-clickable' : ''}`}
                  >
                    <span className="file-icon">{file.type === 'dossier' ? '📁' : '📄'}</span>
                    {file.nom}
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
              ))}
            </tbody>
          </table>

          {filteredFiles.length === 0 && (
            <div className="empty-state">
              {searchQuery ? 'Aucun fichier trouvé' : 'Aucun fichier'}
            </div>
          )}
        </div>

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
                    {!canOpenInApp && (
                      <button onClick={() => {
                        if (item.extension === 'txt' || item.mimeType?.startsWith('text/')) {
                          navigate(`/editor/${item.id}`);
                        }
                        setContextMenu(null);
                      }}>
                        📝 Éditer
                      </button>
                    )}
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
                      setAllFiles(prev => prev.map(f =>
                        f.id === contextMenu.item.id ? { ...f, estFavori: !f.estFavori } : f
                      ));
                      setContextMenu(null);
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
              const fileId = Date.now().toString();
              const newFile = {
                id: fileId,
                nom: file.name,
                type: 'fichier',
                taille: file.size,
                dateModification: new Date().toISOString(),
                extension: file.name.split('.').pop(),
                parentId: currentFolderId,
                mimeType: file.type || 'application/octet-stream',
              };
              
              // Sauvegarder le contenu du fichier
              try {
                await saveFileContent(fileId, file);
              } catch (error) {
                console.error('Erreur lors de la sauvegarde du contenu:', error);
              }
              
              // Ajouter au tableau global et mettre à jour l'affichage
              setAllFiles(prev => [...prev, newFile]);
              setUploadModalOpen(false);
            }}
          />
        )}

        {createFolderModalOpen && (
          <CreateFolderModal
            onClose={() => setCreateFolderModalOpen(false)}
            onCreate={(nom) => {
              const newFolder = {
                id: Date.now().toString(),
                nom,
                type: 'dossier',
                dateModification: new Date().toISOString(),
                parentId: currentFolderId,
              };
              // Ajouter au tableau global et mettre à jour l'affichage
              setAllFiles(prev => [...prev, newFolder]);
              setCreateFolderModalOpen(false);
            }}
          />
        )}

        {renameModal.open && renameModal.item && (
          <RenameModal
            item={renameModal.item}
            onClose={() => setRenameModal({ open: false })}
            onRename={(newName) => {
              setAllFiles(prev => prev.map(f =>
                f.id === renameModal.item?.id ? { ...f, nom: newName } : f
              ));
              setRenameModal({ open: false });
            }}
          />
        )}

        {shareModal.open && shareModal.item && (
          <ShareModal
            item={shareModal.item}
            onClose={() => setShareModal({ open: false })}
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

