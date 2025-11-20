import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import type { FileItem, ShareLink } from '../types';
import { getAllShareLinks } from '../services/storage';
import '../styles/Files.css';

export const Shared = () => {
  const [sharedFiles, setSharedFiles] = useState<Array<{ file: FileItem; link: ShareLink }>>([]);

  useEffect(() => {
    const loadSharedFiles = () => {
      try {
        const saved = localStorage.getItem('monDrive_files');
        const shareLinks = getAllShareLinks();
        
        if (saved && shareLinks.length > 0) {
          const allFiles: FileItem[] = JSON.parse(saved);
          const shared = shareLinks
            .filter(link => link.actif)
            .map(link => {
              const file = allFiles.find(f => f.id === link.fichierId && !f.estSupprime);
              return file ? { file, link } : null;
            })
            .filter((item): item is { file: FileItem; link: ShareLink } => item !== null);
          
          setSharedFiles(shared);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des fichiers partagés:', error);
      }
    };

    loadSharedFiles();
    const handleUpdate = () => loadSharedFiles();
    window.addEventListener('filesUpdated', handleUpdate);
    return () => window.removeEventListener('filesUpdated', handleUpdate);
  }, []);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' Go';
  };

  const copyLink = (link: ShareLink) => {
    navigator.clipboard.writeText(link.url);
    alert('Lien copié !');
  };

  return (
    <Layout>
      <div className="files-page">
        <h1>Partages</h1>
        <div className="files-table-container">
          <table className="files-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Taille</th>
                <th>Lien de partage</th>
                <th>Date d'expiration</th>
              </tr>
            </thead>
            <tbody>
              {sharedFiles.map(({ file, link }) => (
                <tr key={file.id}>
                  <td>
                    <span className="file-icon">{file.type === 'dossier' ? '📁' : '📄'}</span>
                    {file.nom}
                  </td>
                  <td>{file.type === 'dossier' ? 'Dossier' : file.extension?.toUpperCase()}</td>
                  <td>{formatSize(file.taille)}</td>
                  <td>
                    <button 
                      className="btn-secondary btn-small"
                      onClick={() => copyLink(link)}
                    >
                      Copier le lien
                    </button>
                  </td>
                  <td>
                    {link.dateExpiration 
                      ? new Date(link.dateExpiration).toLocaleDateString('fr-FR')
                      : 'Illimité'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sharedFiles.length === 0 && (
            <div className="empty-state">Aucun fichier partagé</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

