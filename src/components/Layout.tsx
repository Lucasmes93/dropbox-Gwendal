import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { SearchBar } from './SearchBar';
import { ChatPanel } from './ChatPanel';
import { UserStatus } from './UserStatus';
import '../styles/Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

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
          <Link to="/files" className="logo">MonDrive</Link>
        </div>
        <div className="header-center">
          <SearchBar />
        </div>
        <div className="header-right">
          <button 
            className="chat-button"
            onClick={() => setChatOpen(!chatOpen)}
            title="Messages"
          >
            💬
            {chatOpen && <span className="chat-indicator" />}
          </button>
          <div className="user-menu">
            <button 
              className="user-button"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <UserStatus userId={user?.id || ''} />
              {user?.prenom} {user?.nom} ▼
            </button>
            {menuOpen && (
              <div className="user-dropdown">
                <Link to="/profile" onClick={() => setMenuOpen(false)}>
                  Profil
                </Link>
                <button onClick={handleLogout}>
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="main-container">
        <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
        <main className="content">
          {children}
        </main>
        {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
      </div>
    </div>
  );
};

