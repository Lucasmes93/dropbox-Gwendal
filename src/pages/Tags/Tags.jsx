import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import './Tags.scss';

export const Tags = () => {
  const [files, setFiles] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = () => {
    try {
      const saved = localStorage.getItem('monDrive_files');
      if (saved) {
        const allFiles = JSON.parse(saved);
        const activeFiles = allFiles.filter(f => !f.estSupprime);
        setFiles(activeFiles);
        
        // Extraire tous les tags uniques des fichiers
        const allTagsSet = new Set();
        activeFiles.forEach(file => {
          if (file.tags && Array.isArray(file.tags)) {
            file.tags.forEach(tag => allTagsSet.add(tag));
          }
        });
        // Tags par défaut s'il n'y en a pas
        if (allTagsSet.size === 0) {
          ['Important', 'Travail', 'Personnel', 'Archive'].forEach(tag => allTagsSet.add(tag));
        }
        setTags(Array.from(allTagsSet).sort());
      }
    } catch (error) {
      console.error('Erreur:', error);
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
            <div className="files-list">
              {filteredFiles.map(file => (
                <div key={file.id} className="file-item">
                  <span className="file-icon">{file.type === 'dossier' ? '📁' : '📄'}</span>
                  {file.nom}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

