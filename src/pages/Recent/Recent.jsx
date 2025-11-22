import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import api from '../../services/api';
import './Recent.scss';

export const Recent = () => {
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentFiles();
  }, []);

  const loadRecentFiles = async () => {
    try {
      setLoading(true);
      const allFiles = await api.getFiles();
      // Trier par date de modification (plus récent en premier)
      const recent = allFiles
        .filter(f => !f.estSupprime)
        .sort((a, b) => 
          new Date(b.dateModification).getTime() - new Date(a.dateModification).getTime()
        )
        .slice(0, 50); // Limiter à 50 fichiers récents
      setRecentFiles(recent);
    } catch (error) {
      setRecentFiles([]);
    } finally {
      setLoading(false);
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
        <h1>Récents</h1>
        <div className="files-table-container">
          <table className="files-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Taille</th>
                <th>Date de modification</th>
              </tr>
            </thead>
            <tbody>
              {recentFiles.map((file) => (
                <tr key={file.id}>
                  <td>
                    <span className="file-icon">{file.type === 'dossier' ? '📁' : '📄'}</span>
                    {file.nom}
                  </td>
                  <td>{file.type === 'dossier' ? 'Dossier' : file.extension?.toUpperCase()}</td>
                  <td>{formatSize(file.taille)}</td>
                  <td>{new Date(file.dateModification).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && recentFiles.length === 0 && (
            <div className="empty-state">Aucun fichier récent</div>
          )}
          {loading && (
            <div className="empty-state">Chargement...</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

