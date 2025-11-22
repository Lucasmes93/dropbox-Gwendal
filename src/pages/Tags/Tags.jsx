import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import api from '../../services/api';
import './Tags.scss';

export const Tags = () => {
  const [files, setFiles] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
    // Recharger toutes les 5 secondes
    const interval = setInterval(loadFiles, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const allFiles = await api.getFiles();
      const activeFiles = allFiles.filter(f => !f.estSupprime);
      setFiles(activeFiles);
      
      // Extraire tous les tags uniques des fichiers
      const allTagsSet = new Set();
      activeFiles.forEach(file => {
        if (file.tags && Array.isArray(file.tags)) {
          file.tags.forEach(tag => allTagsSet.add(tag));
        }
      });
      // Plus de tags par défaut - seulement les tags réels
      setTags(Array.from(allTagsSet).sort());
    } catch (error) {
      setFiles([]);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = selectedTag
    ? files.filter(f => f.tags && f.tags.includes(selectedTag))
    : files;

  return (
    <Layout>
      <div className="tags-page">
        <h1>Étiquettes</h1>
        <div className="tags-container">
          <div className="tags-sidebar">
            <h2>Étiquettes</h2>
            <div className="tags-list">
              <button
                className={`tag-item ${!selectedTag ? 'active' : ''}`}
                onClick={() => setSelectedTag(null)}
              >
                Toutes
              </button>
              {tags.map(tag => (
                <button
                  key={tag}
                  className={`tag-item ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => setSelectedTag(tag)}
                >
                  🏷️ {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="tags-content">
            <h2>{selectedTag ? `Fichiers avec l'étiquette "${selectedTag}"` : 'Tous les fichiers'}</h2>
            {loading ? (
              <div className="empty-state">Chargement...</div>
            ) : (
              <div className="files-list">
                {filteredFiles.length > 0 ? (
                  filteredFiles.map(file => (
                    <div key={file.id} className="file-item">
                      <span className="file-icon">{file.type === 'dossier' ? '📁' : '📄'}</span>
                      {file.nom}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    {selectedTag ? `Aucun fichier avec l'étiquette "${selectedTag}"` : 'Aucun fichier'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

