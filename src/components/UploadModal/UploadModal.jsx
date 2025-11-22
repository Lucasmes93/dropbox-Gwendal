import { useState } from 'react';
import './UploadModal.scss';

export const UploadModal = ({ onClose, onUpload, accept, title = 'Téléverser un fichier' }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Vérifier le type si accept est spécifié
      if (accept && !selectedFile.type.match(accept.replace('*', '.*'))) {
        alert(`Veuillez sélectionner un fichier de type: ${accept}`);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      // Vérifier le type si accept est spécifié
      if (accept && !droppedFile.type.match(accept.replace('*', '.*'))) {
        alert(`Veuillez sélectionner un fichier de type: ${accept}`);
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    // Simuler l'upload avec progression
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Simuler l'upload
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setProgress(100);
      
      if (onUpload) {
        await onUpload(file);
      }
      
      onClose();
    } catch (error) {
    } finally {
      setUploading(false);
      clearInterval(interval);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        
        <div
          className="drop-zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {file ? (
            <div className="file-selected">
              <span>📄 {file.name}</span>
              <span className="file-size">{(file.size / 1024).toFixed(1)} Ko</span>
            </div>
          ) : (
            <>
              <div className="drop-zone-icon">📤</div>
              <p>Glissez-déposez un fichier ici</p>
              <p className="drop-zone-or">ou</p>
              <label className="btn-secondary">
                Choisir un fichier
                <input
                  type="file"
                  accept={accept}
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </label>
            </>
          )}
        </div>

        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>{progress}%</span>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={uploading}>
            Annuler
          </button>
          <button
            className="btn-primary"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Téléversement...' : 'Lancer l\'upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

