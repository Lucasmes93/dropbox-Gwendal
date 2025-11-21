import { useState, useEffect } from 'react';
import './TagModal.scss';

export const TagModal = ({ item, onClose, onSave }) => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [availableTags, setAvailableTags] = useState([]);

  useEffect(() => {
    if (item) {
      setSelectedTags(item.tags || []);
      loadAvailableTags();
    }
  }, [item]);

  const loadAvailableTags = () => {
    try {
      const saved = localStorage.getItem('monDrive_files');
      if (saved) {
        const allFiles = JSON.parse(saved);
        const allTagsSet = new Set();
        allFiles.forEach(file => {
          if (file.tags && Array.isArray(file.tags)) {
            file.tags.forEach(tag => allTagsSet.add(tag));
          }
        });
        // Tags par défaut
        ['Important', 'Travail', 'Personnel', 'Archive', 'Urgent'].forEach(tag => allTagsSet.add(tag));
        setAvailableTags(Array.from(allTagsSet).sort());
      } else {
        setAvailableTags(['Important', 'Travail', 'Personnel', 'Archive', 'Urgent']);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tags:', error);
      setAvailableTags(['Important', 'Travail', 'Personnel', 'Archive', 'Urgent']);
    }
  };

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddNewTag = () => {
    if (newTag.trim() && !availableTags.includes(newTag.trim())) {
      const newTagValue = newTag.trim();
      setAvailableTags([...availableTags, newTagValue].sort());
      setSelectedTags([...selectedTags, newTagValue]);
      setNewTag('');
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(selectedTags);
    }
    onClose();
  };

  if (!item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal tag-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Étiquetter "{item.nom}"</h2>
        
        <div className="form-group">
          <label>Étiquettes disponibles</label>
          <div className="tags-list">
            {availableTags.map(tag => (
              <button
                key={tag}
                type="button"
                className={`tag-button ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => handleTagToggle(tag)}
              >
                🏷️ {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Créer une nouvelle étiquette</label>
          <div className="new-tag-input">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNewTag();
                }
              }}
              placeholder="Nom de l'étiquette"
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={handleAddNewTag}
              disabled={!newTag.trim()}
            >
              Ajouter
            </button>
          </div>
        </div>

        {selectedTags.length > 0 && (
          <div className="form-group">
            <label>Étiquettes sélectionnées</label>
            <div className="selected-tags">
              {selectedTags.map(tag => (
                <span key={tag} className="selected-tag">
                  🏷️ {tag}
                  <button
                    type="button"
                    className="remove-tag"
                    onClick={() => handleTagToggle(tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

