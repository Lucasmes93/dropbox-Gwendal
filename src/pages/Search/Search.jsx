import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import api from '../../services/api';
import './Search.scss';

export const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    searchFiles();
  }, [query]);

  const searchFiles = async () => {
    try {
      setLoading(true);
      const allFiles = await api.getFiles();
      const filtered = allFiles.filter(f => 
        !f.estSupprime && 
        f.nom.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } catch (error) {
      setResults([]);
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
        <h1>Résultats de recherche : "{query}"</h1>
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
              {results.map((file) => (
                <tr key={file.id}>
                  <td>
                    <span className="file-icon">{file.type === 'dossier' ? '📁' : '📄'}</span>
                    {file.nom}
                  </td>
                  <td>{file.type === 'dossier' ? 'Dossier' : file.extension?.toUpperCase()}</td>
                  <td>{formatSize(file.taille)}</td>
                  <td>{new Date(file.dateModification).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && (
            <div className="empty-state">Recherche en cours...</div>
          )}
          {!loading && results.length === 0 && query && (
            <div className="empty-state">Aucun résultat trouvé</div>
          )}
          {!loading && !query && (
            <div className="empty-state">Entrez un terme de recherche</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

