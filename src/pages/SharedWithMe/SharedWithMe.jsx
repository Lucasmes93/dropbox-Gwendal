import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { getAllCompanyShares } from '../../services/storage';
import './SharedWithMe.scss';

export const SharedWithMe = () => {
  const [sharedFiles, setSharedFiles] = useState([]);

  useEffect(() => {
    loadSharedFiles();
    
    // Écouter les mises à jour des partages avec la boîte
    const handleUpdate = () => loadSharedFiles();
    window.addEventListener('companyShareUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('companyShareUpdated', handleUpdate);
    };
  }, []);

  const loadSharedFiles = () => {
    try {
      const saved = localStorage.getItem('monDrive_files');
      const companyShares = getAllCompanyShares();
      
      if (saved && companyShares.length > 0) {
        const allFiles = JSON.parse(saved);
        // Récupérer les fichiers partagés avec la boîte
        const shared = companyShares
          .map(share => {
            const file = allFiles.find(f => f.id === share.fichierId && !f.estSupprime);
            return file ? { file, share } : null;
          })
          .filter(item => item !== null);
        
        setSharedFiles(shared);
      } else {
        setSharedFiles([]);
      }
    } catch (error) {
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' Go';
  };

  return (
    <Layout>
      <div className="files-page">
        <h1>Partagé avec moi</h1>
        <p className="page-description">Fichiers et dossiers que d'autres utilisateurs ont partagés avec vous</p>
        <div className="files-table-container">
          <table className="files-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Taille</th>
                <th>Partagé par</th>
                <th>Date de partage</th>
              </tr>
            </thead>
            <tbody>
              {sharedFiles.map(({ file, share }) => (
                <tr key={file.id}>
                  <td>
                    <span className="file-icon">{file.type === 'dossier' ? '📁' : '📄'}</span>
                    {file.nom}
                    <span className="share-badge">🏢 Partagé avec la boîte</span>
                  </td>
                  <td>{file.type === 'dossier' ? 'Dossier' : file.extension?.toUpperCase()}</td>
                  <td>{formatSize(file.taille)}</td>
                  <td>{share.sharedByUserName}</td>
                  <td>{new Date(share.datePartage).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sharedFiles.length === 0 && (
            <div className="empty-state">Aucun fichier partagé avec vous</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

