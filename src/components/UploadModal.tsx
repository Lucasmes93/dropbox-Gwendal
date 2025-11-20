import { useState, useRef, DragEvent } from 'react';
import '../styles/Modal.css';

interface UploadModalProps {
  onClose: () => void;
  onUpload: (file: File) => void;
}

export const UploadModal = ({ onClose, onUpload }: UploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File | null) => {
    setError('');
    if (selectedFile) {
      // Validation basique
      const maxSize = 100 * 1024 * 1024; // 100 Mo
      if (selectedFile.size > maxSize) {
        setError('Le fichier est trop volumineux (max 100 Mo)');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    // Simulation d'upload
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setUploading(false);
      onUpload(file);
    }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Téléverser un fichier</h2>

        <div
          className={`dropzone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="file-selected">
              <p>📄 {file.name}</p>
              <p className="file-size">
                {(file.size / 1024 / 1024).toFixed(2)} Mo
              </p>
            </div>
          ) : (
            <div className="dropzone-content">
              <p>Glissez-déposez un fichier ici</p>
              <p>ou</p>
              <button
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Choisir un fichier
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        />

        {error && <div className="error-message">{error}</div>}

        {uploading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p>Téléversement en cours... {progress}%</p>
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
            Lancer l'upload
          </button>
        </div>
      </div>
    </div>
  );
};

