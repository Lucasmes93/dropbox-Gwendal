import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Sidebar.scss';

export const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal] = useState(10 * 1024 * 1024 * 1024); // 10 Go
  const [pinnedFolders, setPinnedFolders] = useState([]);
  const [allFolders, setAllFolders] = useState([]);

  useEffect(() => {
    const calculateStorage = () => {
      try {
        const saved = localStorage.getItem('monDrive_files');
        if (saved) {
          const allFiles = JSON.parse(saved);
          const totalSize = allFiles
            .filter((f) => f.type === 'fichier' && !f.estSupprime && f.taille)
            .reduce((sum, f) => sum + (f.taille || 0), 0);
          setStorageUsed(totalSize);
        }
      } catch (error) {
      }
    };

    calculateStorage();
    const handleUpdate = () => calculateStorage();
    window.addEventListener('filesUpdated', handleUpdate);
    return () => window.removeEventListener('filesUpdated', handleUpdate);
  }, []);

  useEffect(() => {
    loadFolders();
    loadPinnedFolders();
    
    // Écouter les changements de dossiers épinglés
    const handlePinnedFoldersChanged = () => {
      loadPinnedFolders();
    };
    
    window.addEventListener('pinnedFoldersChanged', handlePinnedFoldersChanged);
    window.addEventListener('filesUpdated', loadFolders);
    
    return () => {
      window.removeEventListener('pinnedFoldersChanged', handlePinnedFoldersChanged);
      window.removeEventListener('filesUpdated', loadFolders);
    };
  }, [user]);

  const loadFolders = async () => {
    try {
      const files = await api.getFiles();
      const folders = files.filter(f => f.type === 'dossier' && !f.estSupprime);
      setAllFolders(folders);
    } catch (error) {
      setAllFolders([]);
    }
  };

  const loadPinnedFolders = () => {
    try {
      const saved = localStorage.getItem(`monDrive_pinnedFolders_${user?.id}`);
      if (saved) {
        setPinnedFolders(JSON.parse(saved));
      }
    } catch (error) {
      setPinnedFolders([]);
    }
  };

  const togglePinFolder = (folderId) => {
    const newPinned = pinnedFolders.includes(folderId)
      ? pinnedFolders.filter(id => id !== folderId)
      : [...pinnedFolders, folderId];
    
    setPinnedFolders(newPinned);
    localStorage.setItem(`monDrive_pinnedFolders_${user?.id}`, JSON.stringify(newPinned));
  };

  const navigateToFolder = (folderId) => {
    if (onMobileClose) {
      onMobileClose();
    }
    navigate(`/files?folder=${folderId}`);
  };

  const storageUsedMB = storageUsed / (1024 * 1024);
  const isActive = (path) => location.pathname === path;

  const handleNavClick = (path) => {
    // Fermer le menu mobile si nécessaire
    if (onMobileClose) {
      onMobileClose();
    }
    
    // Navigation simple - React Router gère déjà les re-renders
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  return (
    <nav className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-section">
        <div 
          className={`sidebar-item ${isActive('/files') ? 'active' : ''}`}
          onClick={() => handleNavClick('/files')}
        >
          <span className="sidebar-icon">📁</span>
          Tous les fichiers
        </div>
        <div 
          className={`sidebar-item ${isActive('/recent') ? 'active' : ''}`}
          onClick={() => handleNavClick('/recent')}
        >
          <span className="sidebar-icon">🕐</span>
          Récents
        </div>
        <div 
          className={`sidebar-item ${isActive('/favorites') ? 'active' : ''}`}
          onClick={() => handleNavClick('/favorites')}
        >
          <span className="sidebar-icon">⭐</span>
          Favoris
        </div>
        <div 
          className={`sidebar-item ${isActive('/shared') ? 'active' : ''}`}
          onClick={() => handleNavClick('/shared')}
        >
          <span className="sidebar-icon">🔗</span>
          Partages
        </div>
        <div 
          className={`sidebar-item ${isActive('/tags') ? 'active' : ''}`}
          onClick={() => handleNavClick('/tags')}
        >
          <span className="sidebar-icon">🏷️</span>
          Étiquettes
        </div>
        <div 
          className={`sidebar-item ${isActive('/shared-with-me') ? 'active' : ''}`}
          onClick={() => handleNavClick('/shared-with-me')}
        >
          <span className="sidebar-icon">👥</span>
          Partagé avec moi
        </div>
        <div 
          className={`sidebar-item ${isActive('/trash') ? 'active' : ''}`}
          onClick={() => handleNavClick('/trash')}
        >
          <span className="sidebar-icon">🗑️</span>
          Fichiers supprimés
        </div>
      </div>

      <div className="sidebar-divider" />

      {pinnedFolders.length > 0 && (
        <>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Dossiers épinglés</div>
            {pinnedFolders.map(folderId => {
              const folder = allFolders.find(f => f.id === folderId);
              if (!folder) return null;
              return (
                <div 
                  key={folder.id}
                  className="sidebar-item pinned-folder"
                  onClick={() => navigateToFolder(folder.id)}
                >
                  <span className="sidebar-icon">📌</span>
                  {folder.nom}
                  <button
                    className="unpin-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePinFolder(folder.id);
                    }}
                    title="Désépingler"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
          <div className="sidebar-divider" />
        </>
      )}

      <div className="sidebar-section">
        <div className="sidebar-section-title">Applications</div>
        <div 
          className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}
          onClick={() => handleNavClick('/dashboard')}
        >
          <span className="sidebar-icon">📊</span>
          Tableau de bord
        </div>
        <div 
          className={`sidebar-item ${isActive('/calendar') ? 'active' : ''}`}
          onClick={() => handleNavClick('/calendar')}
        >
          <span className="sidebar-icon">📅</span>
          Calendrier
        </div>
        <div 
          className={`sidebar-item ${isActive('/contacts') ? 'active' : ''}`}
          onClick={() => handleNavClick('/contacts')}
        >
          <span className="sidebar-icon">👤</span>
          Contacts
        </div>
        <div 
          className={`sidebar-item ${isActive('/notes') ? 'active' : ''}`}
          onClick={() => handleNavClick('/notes')}
        >
          <span className="sidebar-icon">📝</span>
          Notes
        </div>
        <div 
          className={`sidebar-item ${isActive('/tasks') ? 'active' : ''}`}
          onClick={() => handleNavClick('/tasks')}
        >
          <span className="sidebar-icon">✅</span>
          Tâches
        </div>
        <div 
          className={`sidebar-item ${isActive('/gallery') ? 'active' : ''}`}
          onClick={() => handleNavClick('/gallery')}
        >
          <span className="sidebar-icon">🖼️</span>
          Photos
        </div>
        <div 
          className={`sidebar-item ${isActive('/boards') ? 'active' : ''}`}
          onClick={() => handleNavClick('/boards')}
        >
          <span className="sidebar-icon">📋</span>
          Tableaux
        </div>
        <div 
          className={`sidebar-item ${isActive('/activity') ? 'active' : ''}`}
          onClick={() => handleNavClick('/activity')}
        >
          <span className="sidebar-icon">📋</span>
          Journal
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="sidebar-storage">
          <span className="sidebar-icon">💾</span>
          <div className="storage-info">
            <span className="storage-text">
              {storageUsedMB.toFixed(1)} MB utilisés
            </span>
            <div className="storage-bar">
              <div 
                className="storage-fill" 
                style={{ width: `${(storageUsed / storageTotal) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <div 
          className={`sidebar-item ${isActive('/settings') ? 'active' : ''}`}
          onClick={() => handleNavClick('/settings')}
        >
          <span className="sidebar-icon">⚙️</span>
          Paramètres
        </div>
        {user?.role === 'admin' && (
          <div 
            className={`sidebar-item ${isActive('/admin') ? 'active' : ''}`}
            onClick={() => handleNavClick('/admin')}
          >
            <span className="sidebar-icon">👑</span>
            Administration
          </div>
        )}
      </div>
    </nav>
  );
};

