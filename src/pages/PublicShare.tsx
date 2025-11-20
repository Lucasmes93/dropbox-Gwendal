import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getShareLink } from '../services/storage';
import { getFileContent, base64ToBlob } from '../services/storage';
import type { FileItem } from '../types';
import '../styles/PublicShare.css';

export const PublicShare = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileInfo, setFileInfo] = useState<FileItem | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Token manquant');
      setLoading(false);
      return;
    }

    // Récupérer le lien de partage
    const shareLink = getShareLink(token);
    
    if (!shareLink || !shareLink.actif) {
      setError('Ce lien n\'est plus valide.');
      setLoading(false);
      return;
    }

    // Vérifier l'expiration
    if (shareLink.dateExpiration) {
      const expDate = new Date(shareLink.dateExpiration);
      if (expDate.getTime() < Date.now()) {
        setError('Ce lien a expiré.');
        setLoading(false);
        return;
      }
    }

    // Récupérer les informations du fichier
    try {
      const saved = localStorage.getItem('monDrive_files');
      if (saved) {
        const allFiles: FileItem[] = JSON.parse(saved);
        const file = allFiles.find(f => f.id === shareLink.fichierId && !f.estSupprime);
        
        if (!file) {
          setError('Fichier introuvable.');
          setLoading(false);
          return;
        }

        setFileInfo(file);
      } else {
        setError('Fichier introuvable.');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du fichier:', error);
      setError('Erreur lors du chargement du fichier.');
    }
    
    setLoading(false);
  }, [token]);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' Go';
  };

  const handleDownload = () => {
    if (!fileInfo || !token) return;

    // Récupérer le contenu du fichier
    const fileContent = getFileContent(fileInfo.id);
    
    if (fileContent) {
      const blob = base64ToBlob(fileContent, fileInfo.mimeType);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileInfo.nom;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Fichier sans contenu stocké
      const content = `Contenu du fichier ${fileInfo.nom}\n\nCeci est un fichier de démonstration.`;
      const blob = new Blob([content], { type: fileInfo.mimeType || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileInfo.nom;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="public-share-page">
        <div className="public-share-container">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !fileInfo) {
    return (
      <div className="public-share-page">
        <div className="public-share-container">
          <h1>MonDrive</h1>
          <div className="error-box">
            <p>{error || 'Fichier introuvable'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-share-page">
      <div className="public-share-container">
        <h1>MonDrive</h1>
        <div className="file-info-box">
          <div className="file-icon-large">📄</div>
          <h2>{fileInfo.nom}</h2>
          <p className="file-size">{formatSize(fileInfo.taille)}</p>
          <button className="btn-primary btn-large" onClick={handleDownload}>
            Télécharger
          </button>
        </div>
      </div>
    </div>
  );
};

