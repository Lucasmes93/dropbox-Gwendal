import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { getFileContent, base64ToBlob } from '../../services/storage';
import './OfficeEditor.scss';

export const OfficeEditor = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!fileId) {
      navigate('/files');
      return;
    }

    loadFile();
  }, [fileId]);

  const loadFile = () => {
    try {
      const saved = localStorage.getItem('monDrive_files');
      if (saved) {
        const allFiles = JSON.parse(saved);
        const foundFile = allFiles.find(f => f.id === fileId && !f.estSupprime);
        
        if (!foundFile) {
          setError('Fichier introuvable');
          setLoading(false);
          return;
        }

        setFile(foundFile);
        setLoading(false);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du fichier:', error);
      setError('Erreur lors du chargement');
      setLoading(false);
    }
  };

  const getOfficeViewerUrl = () => {
    if (!file) return '';

    // Pour une vraie application, vous devriez :
    // 1. Servir le fichier via une API backend
    // 2. Utiliser OnlyOffice, Collabora Online, ou Office Online
    // 3. Intégrer avec Microsoft Graph API pour Office 365

    // Solution temporaire : utiliser Office Online Viewer (nécessite que le fichier soit accessible publiquement)
    const fileContent = getFileContent(file.id);
    if (fileContent) {
      // Créer une URL blob temporaire
      const blob = base64ToBlob(fileContent, file.mimeType);
      const url = URL.createObjectURL(blob);
      
      // NoteOnline nécessite une URL publique HTTPS
      // Pour la démo, on affiche un message d'information
      return url;
    }
    return '';
  };

  if (loading) {
    return (
      <Layout>
        <div className="office-editor-loading">Chargement...</div>
      </Layout>
    );
  }

  if (error || !file) {
    return (
      <Layout>
        <div className="office-editor-error">
          <h2>{error || 'Fichier introuvable'}</h2>
          <button className="btn-primary" onClick={() => navigate('/files')}>
            Retour aux fichiers
          </button>
        </div>
      </Layout>
    );
  }

  const isOfficeFile = file.extension === 'docx' || 
                      file.extension === 'xlsx' || 
                      file.extension === 'pptx';

  return (
    <Layout>
      <div className="office-editor">
        <div className="office-editor-header">
          <button className="btn-back" onClick={() => navigate('/files')}>
            ← Retour
          </button>
          <h1>{file.nom}</h1>
          <div className="office-editor-info">
            <span>Édition collaborative</span>
          </div>
        </div>

        <div className="office-editor-content">
          {isOfficeFile ? (
            <div className="office-editor-placeholder">
              <div className="office-editor-message">
                <h2>Édition collaborative Office</h2>
                <p>
                  Pour activer l'édition collaborative des fichiers Office, vous devez intégrer :
                </p>
                <ul>
                  <li><strong>OnlyOffice</strong> open-source d'édition collaborative</li>
                  <li><strong>Collabora Online</strong> bureautique collaborative</li>
                  <li><strong>Microsoft Office Online</strong> Microsoft Graph API</li>
                </ul>
                <p className="office-editor-note">
                  <strong>Note :</strong> Cette fonctionnalité nécessite un serveur backend pour servir les fichiers
                  et une intégration avec l'un de ces services.
                </p>
                <div className="office-editor-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      const fileContent = getFileContent(file.id);
                      if (fileContent) {
                        const blob = base64ToBlob(fileContent, file.mimeType);
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = file.nom;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }
                    }}
                  >
                    Télécharger pour éditer localement
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="office-editor-placeholder">
              <p>Ce type de fichier n'est pas supporté pour l'édition collaborative.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

