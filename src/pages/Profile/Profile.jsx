import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import './Profile.scss';

export const Profile = () => {
  const { user } = useAuth();
  const [nom, setNom] = useState(user?.nom || '');
  const [prenom, setPrenom] = useState(user?.prenom || '');
  const [email, setEmail] = useState(user?.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal] = useState(10 * 1024 * 1024 * 1024); // 10 Go en octets

  // Calculer le stockage utilisé réellement
  useEffect(() => {
    const calculateStorage = () => {
      try {
        const saved = localStorage.getItem('monDrive_files');
        if (saved) {
          const allFiles= JSON.parse(saved);
          // Calculer la taille totale des fichiers non supprimés
          const totalSize = allFiles
            .filter(f => f.type === 'fichier' && !f.estSupprime && f.taille)
            .reduce((sum, f) => sum + (f.taille || 0), 0);
          setStorageUsed(totalSize);
        }
      } catch (error) {
        console.error('Erreur lors du calcul du stockage:', error);
      }
    };

    calculateStorage();
    
    // Écouter les mises à jour
    const handleUpdate = () => calculateStorage();
    window.addEventListener('filesUpdated', handleUpdate);
    
    return () => window.removeEventListener('filesUpdated', handleUpdate);
  }, []);

  const storageUsedGB = storageUsed / (1024 * 1024 * 1024);
  const storageTotalGB = storageTotal / (1024 * 1024 * 1024);
  const storagePercent = (storageUsed / storageTotal) * 100;

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    const newErrors = {};
    if (!nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!prenom.trim()) newErrors.prenom = 'Le prénom est requis';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Simulation d'appel API
    setTimeout(() => {
      setMessage('Profil mis à jour avec succès');
      setTimeout(() => setMessage(''), 3000);
    }, 500);
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    setErrors({});
    setPasswordMessage('');

    const newErrors = {};
    if (!oldPassword) newErrors.oldPassword = 'L\'ancien mot de passe est requis';
    if (!newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Simulation d'appel API
    setTimeout(() => {
      setPasswordMessage('Mot de passe mis à jour avec succès');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(''), 3000);
    }, 500);
  };

  return (
    <Layout>
      <div className="profile-page">
        <h1>Profil</h1>

        <div className="profile-section">
          <h2>Informations personnelles</h2>
          <form onSubmit={handleProfileUpdate} className="profile-form">
            <div className="form-group">
              <label htmlFor="nom">Nom</label>
              <input
                type="text"
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
              {errors.nom && <span className="field-error">{errors.nom}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="prenom">Prénom</label>
              <input
                type="text"
                id="prenom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
              {errors.prenom && <span className="field-error">{errors.prenom}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {message && <div className="success-message">{message}</div>}

            <button type="submit" className="btn-primary">
              Mettre à jour
            </button>
          </form>
        </div>

        <div className="profile-section">
          <h2>Mot de passe</h2>
          <form onSubmit={handlePasswordUpdate} className="profile-form">
            <div className="form-group">
              <label htmlFor="oldPassword">Ancien mot de passe</label>
              <input
                type="password"
                id="oldPassword"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              {errors.oldPassword && <span className="field-error">{errors.oldPassword}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">Nouveau mot de passe</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmation du nouveau mot de passe</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>

            {passwordMessage && <div className="success-message">{passwordMessage}</div>}

            <button type="submit" className="btn-primary">
              Mettre à jour le mot de passe
            </button>
          </form>
        </div>

        <div className="profile-section">
          <h2>Stockage</h2>
          <div className="storage-info">
            <div className="storage-bar">
              <div className="storage-fill" style={{ width: `${storagePercent}%` }} />
            </div>
            <p className="storage-text">
              {storageUsedGB.toFixed(2)} Go utilisés sur {storageTotalGB} Go ({storagePercent.toFixed(1)}%)
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

