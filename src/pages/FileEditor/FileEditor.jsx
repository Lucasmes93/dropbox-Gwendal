import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { getFileContent, base64ToBlob, saveFileContent } from '../../services/storage';
import { UserStatus } from '../../components/UserStatus/UserStatus';
import './FileEditor.scss';



export const FileEditor = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [collaborators, setCollaborators] = useState([]);
  const textareaRef = useRef(null);
  const cursorPositionRef = useRef(0);
  const colors = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336'];

  useEffect(() => {
    if (!fileId) {
      navigate('/files');
      return;
    }

    loadFile();
    joinCollaboration();
    
    // Écouter les mises à jour de collaboration
    const handleCollaborationUpdate = () => {
      loadCollaborators();
    };

    const handleContentUpdate = (event) => {
      const customEvent = event;
      // Ne pas mettre à jour si c'est notre propre modification
      if (customEvent.detail?.userId !== user?.id) {
        loadFile();
      }
    };

    window.addEventListener('fileContentUpdated', handleContentUpdate);
    window.addEventListener('collaboratorUpdate', handleCollaborationUpdate);

    // Écouter les changements de localStorage (pour la collaboration entre onglets)
    const handleStorageChange = (e) => {
      if (e.key === `monDrive_fileContent_${fileId}` || 
          e.key === `monDrive_collaborators_${fileId}`) {
        loadFile();
        loadCollaborators();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('fileContentUpdated', handleContentUpdate);
      window.removeEventListener('collaboratorUpdate', handleCollaborationUpdate);
      window.removeEventListener('storage', handleStorageChange);
      leaveCollaboration();
    };
  }, [fileId]);

  const loadFile = () => {
    try {
      const saved = localStorage.getItem('monDrive_files');
      if (saved) {
        const allFiles = JSON.parse(saved);
        const foundFile = allFiles.find(f => f.id === fileId && !f.estSupprime);
        
        if (!foundFile) {
          navigate('/files');
          return;
        }

        setFile(foundFile);

        // Charger le contenu
        const fileContent = getFileContent(foundFile.id);
        if (fileContent) {
          // Pour les fichiers texte, décoder le base64
          if (foundFile.mimeType?.startsWith('text/') || foundFile.extension === 'txt') {
            const blob = base64ToBlob(fileContent, foundFile.mimeType);
            blob.text().then(text => {
              setContent(text);
              setLoading(false);
            });
          } else {
            // Pour les autres types, afficher un message
            setContent('Ce type de fichier ne peut pas être édité dans cette version.');
            setLoading(false);
          }
        } else {
          setContent('');
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du fichier:', error);
      setLoading(false);
    }
  };

  const joinCollaboration = () => {
    if (!fileId || !user) return;

    const collaborators = getCollaborators();
    const existingIndex = collaborators.findIndex(c => c.userId === user.id);
    
    if (existingIndex === -1) {
      const newCollaborator = {
        userId: user.id,
        userName: `${user.prenom} ${user.nom}`,
        cursorPosition: 0,
        color: colors[collaborators.length % colors.length],
      };
      collaborators.push(newCollaborator);
      saveCollaborators(collaborators);
      broadcastCollaboratorUpdate();
    }
  };

  const leaveCollaboration = () => {
    if (!fileId || !user) return;

    const collaborators = getCollaborators();
    const filtered = collaborators.filter(c => c.userId !== user.id);
    saveCollaborators(filtered);
    broadcastCollaboratorUpdate();
  };

  const getCollaborators = () => {
    try {
      const saved = localStorage.getItem(`monDrive_collaborators_${fileId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveCollaborators = (collaborators) => {
    localStorage.setItem(`monDrive_collaborators_${fileId}`, JSON.stringify(collaborators));
  };

  const loadCollaborators = () => {
    const collabs = getCollaborators().filter(c => c.userId !== user?.id);
    setCollaborators(collabs);
  };

  const broadcastCollaboratorUpdate = () => {
    window.dispatchEvent(new Event('collaboratorUpdate'));
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
    
    // Sauvegarder le contenu avec un timestamp pour éviter les conflits
    if (fileId && file) {
      const blob = new Blob([newContent], { type: file.mimeType || 'text/plain' });
      const fileObj = new File([blob], file.nom, { type: file.mimeType || 'text/plain' });
      
      // Sauvegarder via le service de stockage
      saveFileContent(fileId, fileObj).then(() => {
        // Marquer la dernière modification avec notre userId
        localStorage.setItem(`monDrive_fileLastEdit_${fileId}`, JSON.stringify({
          userId: user?.id,
          timestamp: Date.now(),
        }));
      });

      // Mettre à jour la date de modification
      const saved = localStorage.getItem('monDrive_files');
      if (saved) {
        const allFiles = JSON.parse(saved);
        const updated = allFiles.map(f =>
          f.id === fileId ? { ...f, dateModification: new Date().toISOString() } : f
        );
        localStorage.setItem('monDrive_files', JSON.stringify(updated));
        window.dispatchEvent(new Event('filesUpdated'));
      }

      // Notifier les autres collaborateurs avec un événement personnalisé
      window.dispatchEvent(new CustomEvent('fileContentUpdated', {
        detail: { fileId, userId: user?.id }
      }));
    }
  };

  const handleCursorChange = () => {
    if (!textareaRef.current || !user || !fileId) return;

    const position = textareaRef.current.selectionStart;
    cursorPositionRef.current = position;

    const collaborators = getCollaborators();
    const index = collaborators.findIndex(c => c.userId === user.id);
    
    if (index !== -1) {
      collaborators[index].cursorPosition = position;
      saveCollaborators(collaborators);
      broadcastCollaboratorUpdate();
    }
  };

  useEffect(() => {
    loadCollaborators();
    
    // Vérifier les mises à jour de contenu des autres utilisateurs
    const checkForUpdates = () => {
      if (!fileId) return;
      
      try {
        const saved = localStorage.getItem(`monDrive_fileContent_${fileId}`);
        if (saved) {
          const fileContent = getFileContent(fileId);
          if (fileContent && file) {
            if (file.mimeType?.startsWith('text/') || file.extension === 'txt') {
              const blob = base64ToBlob(fileContent, file.mimeType);
              blob.text().then(text => {
                // Ne mettre à jour que si le contenu a changé et qu'on n'est pas en train de taper
                if (text !== content && document.activeElement !== textareaRef.current) {
                  setContent(text);
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des mises à jour:', error);
      }
    };

    const interval = setInterval(() => {
      try {
        loadCollaborators();
        checkForUpdates();
      } catch (error) {
        console.error('Erreur lors de la vérification des mises à jour:', error);
      }
    }, 500); // Vérifier toutes les 500ms pour un temps réel plus fluide
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fileId, user, content, file]);

  if (loading) {
    return (
      <Layout>
        <div className="file-editor-loading">Chargement...</div>
      </Layout>
    );
  }

  if (!file) {
    return (
      <Layout>
        <div className="file-editor-error">Fichier introuvable</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="file-editor">
        <div className="file-editor-header">
          <div className="file-editor-title">
            <button className="btn-back" onClick={() => navigate('/files')}>
              ← Retour
            </button>
            <h1>{file.nom}</h1>
          </div>
          <div className="file-editor-collaborators">
            <span className="collaborators-label">Éditeurs :</span>
            <div className="collaborators-list">
              <div className="collaborator-badge current">
                <UserStatus status={user?.status || 'online'} />
                {user?.prenom} {user?.nom} (vous)
              </div>
              {collaborators.map(collab => (
                <div key={collab.userId} className="collaborator-badge" style={{ borderColor: collab.color }}>
                  <UserStatus status="online" />
                  {collab.userName}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="file-editor-content">
          <textarea
            ref={textareaRef}
            className="file-editor-textarea"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onSelect={handleCursorChange}
            onClick={handleCursorChange}
            onKeyUp={handleCursorChange}
            placeholder="Commencez à taper..."
            spellCheck={false}
          />
        </div>

        <div className="file-editor-footer">
          <div className="file-editor-info">
            Dernière modification : {new Date(file.dateModification).toLocaleString('fr-FR')}
          </div>
          <div className="file-editor-actions">
            <button className="btn-primary" onClick={() => navigate('/files')}>
              Enregistrer et fermer
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

