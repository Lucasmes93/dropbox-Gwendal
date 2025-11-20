import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/PublicShare.css';

export const PublicShare = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileInfo, setFileInfo] = useState<{
    nom: string;
    taille?: number;
    type: string;
  } | null>(null);

  useEffect(() => {
    // Simulation d'appel API pour vérifier le token
    setTimeout(() => {
      // Simulation : si le token commence par 'invalid', on retourne une erreur
      if (token?.startsWith('invalid')) {
        setError('Ce lien n\'est plus valide.');
        setLoading(false);
        return;
      }

      // Sinon, on retourne des infos mock
      setFileInfo({
        nom: 'document_partage.pdf',
        taille: 2048576,
        type: 'fichier',
      });
      setLoading(false);
    }, 1000);
  }, [token]);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' Go';
  };

  const handleDownload = () => {
    console.log('Téléchargement du fichier partagé');
    // Logique de téléchargement
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

