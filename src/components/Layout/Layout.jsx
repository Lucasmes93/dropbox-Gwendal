import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../Sidebar/Sidebar';
import { SearchBar } from '../SearchBar/SearchBar';
import { ChatPanel } from '../ChatPanel/ChatPanel';
import { Notifications } from '../Notifications/Notifications';
import { UserStatus } from '../UserStatus/UserStatus';
import { isSyncActive, getLastSyncTimestamp } from '../../services/sync';
import './Layout.scss';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'syncing', 'error'
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    // Mettre à jour le statut de synchronisation (moins fréquemment pour éviter les re-renders)
    const updateSyncStatus = () => {
      const active = isSyncActive();
      const timestamp = getLastSyncTimestamp();
      setSyncStatus(prev => {
        const newStatus = active ? 'synced' : 'error';
        return prev !== newStatus ? newStatus : prev; // Ne mettre à jour que si changé
      });
      if (timestamp) {
        const newDate = new Date(timestamp);
        setLastSync(prev => {
          // Ne mettre à jour que si la date a vraiment changé (plus de 1 seconde de différence)
          if (!prev || Math.abs(newDate.getTime() - prev.getTime()) > 1000) {
            return newDate;
          }
          return prev;
        });
      }
    };

    // Mettre à jour toutes les 3 secondes (réduit de 1 seconde)
    const interval = setInterval(updateSyncStatus, 3000);
    updateSyncStatus();

    // Écouter les événements de synchronisation
    const handleSyncCompleted = () => {
      setSyncStatus('synced');
      setLastSync(new Date());
    };

    window.addEventListener('syncCompleted', handleSyncCompleted);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('syncCompleted', handleSyncCompleted);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-left">
          <button 
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
          <Link to="/files" className="logo" onClick={(e) => {
            // S'assurer que la navigation fonctionne
            if (window.location.pathname === '/files') {
              e.preventDefault();
              window.location.href = '/files';
            }
          }}>MonDrive</Link>
        </div>
        <div className="header-center">
          <SearchBar />
        </div>
        <div className="header-right">
          <div className="sync-status" title={lastSync ? `Dernière sync: ${lastSync.toLocaleTimeString('fr-FR')}` : 'Synchronisation active'}>
            <span className={`sync-indicator ${syncStatus}`}>
              {syncStatus === 'synced' ? '✓' : syncStatus === 'syncing' ? '⟳' : '⚠'}
            </span>
            <span className="sync-text">Sync auto</span>
          </div>
          <button 
            className="chat-button"
            onClick={() => {
              setChatOpen(!chatOpen);
              setNotificationsOpen(false);
            }}
            title="Messages"
          >
            💬
            {chatOpen && <span className="chat-indicator" />}
          </button>
          <button 
            className="notifications-button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setChatOpen(false);
            }}
            title="Notifications"
          >
            🔔
          </button>
          <div className="user-menu">
            <button 
              className="user-menu-button"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <UserStatus status={user?.status || 'offline'} />
              <span>{user?.prenom} {user?.nom}</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            {menuOpen && (
              <div className="user-menu-dropdown">
                <Link to="/profile" onClick={() => setMenuOpen(false)}>Profil</Link>
                <Link to="/settings" onClick={() => setMenuOpen(false)}>Paramètres</Link>
                <button onClick={handleLogout}>Déconnexion</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="layout-content">
        <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
        <main className="content">
          {children}
        </main>
        {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
        {notificationsOpen && <Notifications onClose={() => setNotificationsOpen(false)} />}
      </div>
    </div>
  );
};

