import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar = ({ mobileOpen, onMobileClose }: SidebarProps) => {
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
            .filter((f: any) => f.type === 'fichier' && !f.estSupprime && f.taille)
            .reduce((sum: number, f: any) => sum + (f.taille || 0), 0);
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
  const isActive = (path: string) => location.pathname === path;

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
          Paramètres de Fichiers
        </Link>
      </div>
    </nav>
  );
};

