import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { UserStatus } from '../../components/UserStatus/UserStatus';
import api from '../../services/api';
import { onWebSocketEvent } from '../../services/websocket';
import './FileEditor.scss';



export const FileEditor = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const textareaRef = useRef(null);
  const cursorPositionRef = useRef(0);
  const saveTimeoutRef = useRef(null);
  const colors = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336'];

  useEffect(() => {
    if (!fileId) {
      navigate('/files');
      return;
    }

    loadFile();
    joinCollaboration();
    
    // Écouter les mises à jour WebSocket
    const unsubscribeFileUpdated = onWebSocketEvent('file_updated', (data) => {
      if (data.file && data.file.id === fileId && data.userId !== user?.id) {
        // Le fichier a été modifié par quelqu'un d'autre, recharger
        loadFile();
      }
    });

    // Écouter les mises à jour de collaboration
    const handleCollaborationUpdate = () => {
      loadCollaborators();
    };

    window.addEventListener('collaboratorUpdate', handleCollaborationUpdate);

    return () => {
      unsubscribeFileUpdated();
      window.removeEventListener('collaboratorUpdate', handleCollaborationUpdate);
      leaveCollaboration();
      // Annuler la sauvegarde en attente
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [fileId]);

  const loadFile = async () => {
    try {
      setLoading(true);
      
      // Charger les métadonnées du fichier depuis l'API
      const fileData = await api.getFile(fileId);
      
      if (!fileData || fileData.estSupprime) {
        navigate('/files');
        return;
      }

      setFile(fileData);

      // Vérifier si c'est un fichier texte éditable
      const isTextFile = fileData.mimeType?.startsWith('text/') || 
                        fileData.extension === 'txt' ||
                        fileData.extension === 'js' ||
                        fileData.extension === 'jsx' ||
                        fileData.extension === 'ts' ||
                        fileData.extension === 'tsx' ||
                        fileData.extension === 'json' ||
                        fileData.extension === 'css' ||
                        fileData.extension === 'scss' ||
                        fileData.extension === 'html' ||
                        fileData.extension === 'xml' ||
                        fileData.extension === 'md' ||
                        fileData.extension === 'yaml' ||
                        fileData.extension === 'yml';

      if (!isTextFile) {
        setContent('Ce type de fichier ne peut pas être édité dans cette version.');
        setLoading(false);
        return;
      }

      // Télécharger le contenu depuis l'API
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/files/${fileId}/download`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const blob = await response.blob();
          const text = await blob.text();
          setContent(text);
        } else {
          setContent('');
        }
      } catch (error) {
        setContent('');
      }
      
      setLoading(false);
    } catch (error) {
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

  const saveFile = async (contentToSave) => {
    if (!fileId || !file) return;

    try {
      setSaving(true);
      const blob = new Blob([contentToSave], { type: file.mimeType || 'text/plain' });
      const fileObj = new File([blob], file.nom, { type: file.mimeType || 'text/plain' });
      
      // Sauvegarder via l'API backend
      await api.updateFileContent(fileId, fileObj);
      
      setLastSaved(new Date());
      
      // Le fichier sera automatiquement synchronisé vers le dossier local via WebSocket
      // (l'événement 'file_updated' déclenchera la synchronisation)
    } catch (error) {
      // Erreur silencieuse, on peut afficher une notification si nécessaire
    } finally {
      setSaving(false);
    }
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
    
    // Debounce : sauvegarder 1 seconde après la dernière modification
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveFile(newContent);
    }, 1000); // Sauvegarder 1 seconde après la dernière frappe
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
    
    // Vérifier périodiquement les mises à jour depuis le serveur
    const interval = setInterval(() => {
      try {
        loadCollaborators();
        // Recharger le fichier toutes les 3 secondes pour voir les modifications des autres
        if (document.activeElement !== textareaRef.current) {
          loadFile();
        }
      } catch (error) {
      }
    }, 3000); // Vérifier toutes les 3 secondes
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fileId, user]);

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
            <div>
              Dernière modification : {new Date(file.dateModification).toLocaleString('fr-FR')}
            </div>
            {saving && (
              <div style={{ color: '#2196f3', marginLeft: '1rem' }}>
                💾 Enregistrement...
              </div>
            )}
            {lastSaved && !saving && (
              <div style={{ color: '#4caf50', marginLeft: '1rem' }}>
                ✓ Sauvegardé à {lastSaved.toLocaleTimeString('fr-FR')}
              </div>
            )}
          </div>
          <div className="file-editor-actions">
            <button 
              className="btn-primary" 
              onClick={async () => {
                // Sauvegarder avant de fermer
                if (saveTimeoutRef.current) {
                  clearTimeout(saveTimeoutRef.current);
                }
                await saveFile(content);
                navigate('/files');
              }}
            >
              Enregistrer et fermer
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

