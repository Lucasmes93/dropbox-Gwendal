import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.scss';

export const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const location = useLocation();
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

  return (
    <nav className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-section">
        <Link 
          to="/files" 
          className={`sidebar-item ${isActive('/files') ? 'active' : ''}`}
          onClick={onMobileClose}
        >
          <span className="sidebar-icon">📁</span>
          Tous les fichiers
        </Link>
        <Link 
          to="/recent" 
          className={`sidebar-item ${isActive('/recent') ? 'active' : ''}`}
          onClick={onMobileClose}
        >
          <span className="sidebar-icon">🕐</span>
          Récents
        </Link>
        <Link 
          to="/favorites" 
          className={`sidebar-item ${isActive('/favorites') ? 'active' : ''}`}
          onClick={onMobileClose}
        >
          <span className="sidebar-icon">⭐</span>
          Favoris
        </Link>
        <Link 
          to="/shared" 
          className={`sidebar-item ${isActive('/shared') ? 'active' : ''}`}
          onClick={onMobileClose}
        >
          <span className="sidebar-icon">🔗</span>
          Partages
        </Link>
        <Link 
          to="/tags" 
          className={`sidebar-item ${isActive('/tags') ? 'active' : ''}`}
          onClick={onMobileClose}
        >
          <span className="sidebar-icon">🏷️</span>
          Étiquettes
        </Link>
        <Link 
          to="/shared-with-me" 
          className={`sidebar-item ${isActive('/shared-with-me') ? 'active' : ''}`}
          onClick={onMobileClose}
        >
          <span className="sidebar-icon">👥</span>
          Partagé avec les cercles
        </Link>
        <Link 
          to="/trash" 
          className={`sidebar-item ${isActive('/trash') ? 'active' : ''}`}
          onClick={onMobileClose}
        >
          <span className="sidebar-icon">🗑️</span>
          Fichiers supprimés
        </Link>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="sidebar-section-title">Applications</div>
        <Link 
          to="/dashboard" 
          className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}
          onClick={onMobileClose}
        >
          <span className="sidebar-icon">📊</span>
          Tableau de bord
        </Link>
        <Link 
          to="/calendar" 
          className={`sidebar-item ${isActive('/calendar') ? 'active' : ''}`}
          onClick={onMobileClose}
        >
          <span className="sidebar-icon">📅</span>
          Calendrier
        </Link>
        <Link 
          to="/contacts" 
          className={`sidebar-item ${isActive('/contacts') ? 'active' : ''}`}
          onClick={onMobileClose}
        >
          <span className="sidebar-icon">👤</span>
          Contacts
        </Link>
        <Link 
          to="/notes" 
          className={`sidebar-item ${isActive('/notes') ? 'active' : ''}`}
          onClick={onMobileClose}
        >
          <span className="sidebar-icon">📝</span>
          Notes
        </Link>
        <Link 
          to="/tasks" 
          className={`sidebar-item ${isActive('/tasks') ? 'active' : ''}`}
          onClick={onMobileClose}
        >
          <span className="sidebar-icon">✅</span>
          Tâches
        </Link>
        <Link 
          to="/gallery" 
          className={`sidebar-item ${isActive('/gallery') ? 'active' : ''}`}
          onClick={onMobileClose}
        >
          <span className="sidebar-icon">🖼️</span>
          Photos
        </Link>
        <Link 
          to="/boards" 
          className={`sidebar-item ${isActive('/boards') ? 'active' : ''}`}
          onClick={onMobileClose}
        >
          <span className="sidebar-icon">📋</span>
          Tableaux
        </Link>
        <Link 
          to="/activity" 
          className={`sidebar-item ${isActive('/activity') ? 'active' : ''}`}
          onClick={onMobileClose}
        >
          <span className="sidebar-icon">🔔</span>
          Activité
        </Link>
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
        <Link 
          to="/settings" 
          className={`sidebar-item ${isActive('/settings') ? 'active' : ''}`}
          onClick={onMobileClose}
        >
          <span className="sidebar-icon">⚙️</span>
          Paramètres
        </Link>
      </div>
    </nav>
  );
};

