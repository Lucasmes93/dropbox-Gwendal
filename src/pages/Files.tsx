import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { Layout } from '../components/Layout';
import type { FileItem } from '../types';
import { UploadModal } from '../components/UploadModal';
import { CreateFolderModal } from '../components/CreateFolderModal';
import { RenameModal } from '../components/RenameModal';
import { ShareModal } from '../components/ShareModal';
import '../styles/Files.css';

interface PathItem {
  nom: string;
  id?: string;
}

export const Files = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<PathItem[]>([{ nom: 'Mes fichiers' }]);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [renameModal, setRenameModal] = useState<{ open: boolean; item?: FileItem }>({ open: false });
  const [shareModal, setShareModal] = useState<{ open: boolean; item?: FileItem }>({ open: false });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileItem } | null>(null);

  // Données mock initiales
  const getInitialFiles = (): FileItem[] => [
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
  const [allFiles, setAllFiles] = useState<FileItem[]>(() => {
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

  // Sauvegarder dans localStorage à chaque modification
  useEffect(() => {
    try {
      localStorage.setItem('monDrive_files', JSON.stringify(allFiles));
      // Déclencher un événement personnalisé pour notifier les autres composants
      window.dispatchEvent(new Event('filesUpdated'));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde dans localStorage:', error);
    }
  }, [allFiles]);

  // Écouter les mises à jour depuis d'autres pages (comme la corbeille)
  useEffect(() => {
    const handleFilesUpdate = () => {
      try {
        const saved = localStorage.getItem('monDrive_files');
        if (saved) {
          const updated = JSON.parse(saved);
          setAllFiles(updated);
        }
      } catch (error) {
        console.error('Erreur lors du rechargement des fichiers:', error);
      }
    };

    window.addEventListener('filesUpdated', handleFilesUpdate);
    return () => window.removeEventListener('filesUpdated', handleFilesUpdate);
  }, []);

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

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' Go';
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'dossier') {
      setCurrentPath([...currentPath, { nom: file.nom, id: file.id }]);
      setCurrentFolderId(file.id);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
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

  const handleDelete = (item: FileItem) => {
    // Marquer comme supprimé au lieu de supprimer définitivement
    setAllFiles(prev => prev.map(f =>
      f.id === item.id ? { ...f, estSupprime: true } : f
    ));
    setContextMenu(null);
  };

  const downloadFile = (item: FileItem) => {
    // Pour une vraie app, on ferait un appel API pour récupérer le fichier
    // Ici, on simule avec un blob
    const content = `Contenu du fichier ${item.nom}\n\nCeci est un fichier de démonstration.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = item.nom;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadFolder = async (folder: FileItem) => {
    // Récupérer tous les fichiers du dossier et de ses sous-dossiers
    const getAllFilesInFolder = (folderId: string, path: string = ''): Array<{ file: FileItem; path: string }> => {
      const result: Array<{ file: FileItem; path: string }> = [];
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
      // Simuler le contenu du fichier
      const content = `Contenu du fichier ${file.nom}\n\nCeci est un fichier de démonstration.`;
      zip.file(path, content);
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

  const handleDownload = (item: FileItem) => {
    if (item.type === 'fichier') {
      downloadFile(item);
    } else {
      downloadFolder(item);
    }
    setContextMenu(null);
  };

  const filteredFiles = files.filter(file =>
    file.nom.toLowerCase().includes(searchQuery.toLowerCase()) && !file.estSupprime
  );

  return (
    <Layout>
      <div className="files-page">
        <div className="toolbar">
          <div className="toolbar-left">
            <button className="btn-primary" onClick={() => setUploadModalOpen(true)}>
              Téléverser
            </button>
            <button className="btn-secondary" onClick={() => setCreateFolderModalOpen(true)}>
              Nouveau dossier
            </button>
          </div>
          <div className="toolbar-right">
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
                  <td onClick={() => handleFileClick(file)} className="file-name">
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
              <button onClick={() => handleDownload(contextMenu.item)}>
                Télécharger
              </button>
              <button onClick={() => {
                setRenameModal({ open: true, item: contextMenu.item });
                setContextMenu(null);
              }}>
                Renommer
              </button>
              <button onClick={() => {
                setShareModal({ open: true, item: contextMenu.item });
                setContextMenu(null);
              }}>
                Partager
              </button>
              <button onClick={() => handleDelete(contextMenu.item)} className="danger">
                Supprimer
              </button>
            </div>
          </>
        )}

        {uploadModalOpen && (
          <UploadModal
            onClose={() => setUploadModalOpen(false)}
            onUpload={(file) => {
              const newFile: FileItem = {
                id: Date.now().toString(),
                nom: file.name,
                type: 'fichier',
                taille: file.size,
                dateModification: new Date().toISOString(),
                extension: file.name.split('.').pop(),
                parentId: currentFolderId,
              };
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
              const newFolder: FileItem = {
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
      </div>
    </Layout>
  );
};

