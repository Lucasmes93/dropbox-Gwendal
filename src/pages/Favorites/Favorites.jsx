import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import api from '../../services/api';
import './Favorites.scss';

export const Favorites = () => {
  const [favoriteFiles, setFavoriteFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
    // Recharger toutes les 5 secondes
    const interval = setInterval(loadFavorites, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const allFiles = await api.getFiles();
      const favorites = allFiles.filter(f => f.estFavori && !f.estSupprime);
      setFavoriteFiles(favorites);
    } catch (error) {
      setFavoriteFiles([]);
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
        <h1>Favoris</h1>
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
              {favoriteFiles.map((file) => (
                <tr key={file.id}>
                  <td>
                    <span className="file-icon">⭐</span>
                    {file.nom}
                  </td>
                  <td>{file.type === 'dossier' ? 'Dossier' : file.extension?.toUpperCase()}</td>
                  <td>{formatSize(file.taille)}</td>
                  <td>{new Date(file.dateModification).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && favoriteFiles.length === 0 && (
            <div className="empty-state">Aucun fichier favori</div>
          )}
          {loading && (
            <div className="empty-state">Chargement...</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

