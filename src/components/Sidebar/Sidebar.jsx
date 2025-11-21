import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.scss';

export const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal] = useState(10 * 1024 * 1024 * 1024); // 10 Go

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
        console.error('Erreur lors du calcul du stockage:', error);
      }
    };

    calculateStorage();
    const handleUpdate = () => calculateStorage();
    window.addEventListener('filesUpdated', handleUpdate);
    return () => window.removeEventListener('filesUpdated', handleUpdate);
  }, []);

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
          Partagé avec les cercles
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
          <span className="sidebar-icon">🔔</span>
          Activité
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
      </div>
    </nav>
  );
};

