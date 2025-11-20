import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <div className="header-right">
          <div className="user-menu">
            <button 
              className="user-button"
              onClick={() => setMenuOpen(!menuOpen)}
            >
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
        <nav className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/files" onClick={() => setMobileMenuOpen(false)}>
            Mes fichiers
          </Link>
          <Link to="/trash" onClick={() => setMobileMenuOpen(false)}>
            Corbeille
          </Link>
          <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
            Profil
          </Link>
        </nav>

        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

