import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import './SharedWithMe.scss';

export const SharedWithMe = () => {
  const [sharedFiles, setSharedFiles] = useState([]);

  useEffect(() => {
    loadSharedFiles();
  }, []);

  const loadSharedFiles = () => {
    try {
      const saved = localStorage.getItem('monDrive_files');
      if (saved) {
        const allFiles = JSON.parse(saved);
        // Simuler les fichiers partagés avec l'utilisateur
        // Dans une vraie app, cela viendrait de l'API
        const shared = allFiles.filter(f => !f.estSupprime).slice(0, 10);
        setSharedFiles(shared);
      }
    } catch (error) {
      console.error('Erreur:', error);
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
        <h1>Partagé avec les cercles</h1>
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
              {sharedFiles.map((file) => (
                <tr key={file.id}>
                  <td>
                    <span className="file-icon">{file.type === 'dossier' ? '📁' : '📄'}</span>
                    {file.nom}
                  </td>
                  <td>{file.type === 'dossier' ? 'Dossier' : file.extension?.toUpperCase()}</td>
                  <td>{formatSize(file.taille)}</td>
                  <td>Marie Dupont</td>
                  <td>{new Date(file.dateModification).toLocaleDateString('fr-FR')}</td>
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

