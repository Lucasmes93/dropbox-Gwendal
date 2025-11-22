import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Profile.scss';

export const Profile = () => {
  const { user, setUser } = useAuth();
  const [nom, setNom] = useState(user?.nom || '');
  const [prenom, setPrenom] = useState(user?.prenom || '');
  const [email, setEmail] = useState(user?.email || '');
  const [status, setStatus] = useState(user?.status || 'offline');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal] = useState(10 * 1024 * 1024 * 1024); // 10 Go en octets

  // Mettre à jour les champs quand l'utilisateur change
  useEffect(() => {
    if (user) {
      setNom(user.nom || '');
      setPrenom(user.prenom || '');
      setEmail(user.email || '');
      setStatus(user.status || 'offline');
    }
  }, [user]);

  // Calculer le stockage utilisé depuis l'API
  useEffect(() => {
    const calculateStorage = async () => {
      try {
        const allFiles = await api.getFiles();
        const totalSize = allFiles
          .filter(f => f.type === 'fichier' && !f.estSupprime && f.taille)
          .reduce((sum, f) => sum + (f.taille || 0), 0);
        setStorageUsed(totalSize);
      } catch (error) {
        setStorageUsed(0);
      }
    };

    calculateStorage();
    // Recalculer toutes les 5 secondes
    const interval = setInterval(calculateStorage, 5000);
    return () => clearInterval(interval);
  }, []);

  const storageUsedGB = storageUsed / (1024 * 1024 * 1024);
  const storageTotalGB = storageTotal / (1024 * 1024 * 1024);
  const storagePercent = (storageUsed / storageTotal) * 100;

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage('');
    setLoading(true);

    const newErrors = {};
    if (!nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!prenom.trim()) newErrors.prenom = 'Le prénom est requis';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // Mettre à jour via l'API
      const updatedUser = await api.updateUser(user?.id || '', {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim(),
        status: status,
      });

      // Mettre à jour l'utilisateur dans le contexte
      setUser(updatedUser);
      
      // Mettre à jour localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setMessage('Profil mis à jour avec succès');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('');
      setErrors({ general: error?.message || 'Erreur lors de la mise à jour du profil' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setErrors({});
    setPasswordMessage('');
    setLoading(true);

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
      setLoading(false);
      return;
    }

    try {
      // Changer le mot de passe via l'API
      await api.changePassword(user?.id || '', oldPassword, newPassword);
      
      setPasswordMessage('Mot de passe mis à jour avec succès');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(''), 3000);
    } catch (error) {
      setPasswordMessage('');
      setErrors({ password: error?.message || 'Erreur lors du changement de mot de passe' });
    } finally {
      setLoading(false);
    }
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

            <div className="form-group">
              <label htmlFor="status">Statut</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="status-select"
              >
                <option value="online">En ligne</option>
                <option value="away">Absent</option>
                <option value="busy">Occupé</option>
                <option value="offline">Hors ligne</option>
              </select>
              <p className="form-hint">Votre statut sera visible par les autres utilisateurs</p>
            </div>

            {errors.general && <div className="error-message">{errors.general}</div>}
            {message && <div className="success-message">{message}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
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

            {errors.password && <div className="error-message">{errors.password}</div>}
            {passwordMessage && <div className="success-message">{passwordMessage}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
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

