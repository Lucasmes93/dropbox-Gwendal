import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import type { FileItem } from '../types';
import '../styles/Files.css';

export const Favorites = () => {
  const [favoriteFiles, setFavoriteFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const saved = localStorage.getItem('monDrive_files');
        if (saved) {
          const allFiles: FileItem[] = JSON.parse(saved);
          const favorites = allFiles.filter(f => f.estFavori && !f.estSupprime);
          setFavoriteFiles(favorites);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des favoris:', error);
      }
    };

    loadFavorites();
    const handleUpdate = () => loadFavorites();
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
          {favoriteFiles.length === 0 && (
            <div className="empty-state">Aucun fichier favori</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

