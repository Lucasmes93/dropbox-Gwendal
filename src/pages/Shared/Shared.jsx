import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Shared.scss';

export const Shared = () => {
  const { user } = useAuth();
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedFiles();
    // Recharger toutes les 5 secondes
    const interval = setInterval(loadSharedFiles, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const loadSharedFiles = async () => {
    try {
      setLoading(true);
      const allFiles = await api.getFiles();
      // Filtrer les fichiers partagés (avec partage actif)
      const shared = allFiles
        .filter(f => !f.estSupprime && (f.partagePublic || f.partageAvecBoite))
        .map(file => ({
          file,
          type: file.partagePublic ? 'public' : 'company',
        }));
      setSharedFiles(shared);
    } catch (error) {
      setSharedFiles([]);
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

  const copyLink = (link) => {
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
                <th>Type de partage</th>
                <th>Lien / Info</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {sharedFiles.map((item) => (
                <tr key={item.file.id}>
                  <td>
                    <span className="file-icon">{item.file.type === 'dossier' ? '📁' : '📄'}</span>
                    {item.file.nom}
                  </td>
                  <td>{item.file.type === 'dossier' ? 'Dossier' : item.file.extension?.toUpperCase()}</td>
                  <td>{formatSize(item.file.taille)}</td>
                  <td>
                    {item.type === 'public' ? (
                      <span className="share-type-badge public">🔗 Lien public</span>
                    ) : (
                      <span className="share-type-badge company">🏢 Toute la boîte</span>
                    )}
                  </td>
                  <td>
                    {item.type === 'public' && item.link ? (
                      <button 
                        className="btn-secondary btn-small"
                        onClick={() => copyLink(item.link)}
                      >
                        Copier le lien
                      </button>
                    ) : item.type === 'company' ? (
                      <span className="share-info">Partagé avec tous</span>
                    ) : null}
                  </td>
                  <td>
                    {item.type === 'public' && item.link ? (
                      item.link.dateExpiration 
                        ? new Date(item.link.dateExpiration).toLocaleDateString('fr-FR')
                        : 'Illimité'
                    ) : item.type === 'company' && item.share ? (
                      new Date(item.share.datePartage).toLocaleDateString('fr-FR')
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && sharedFiles.length === 0 && (
            <div className="empty-state">Aucun fichier partagé</div>
          )}
          {loading && (
            <div className="empty-state">Chargement...</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

