import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saveShareLink, getShareLinkByFileId, saveCompanyShare, getCompanyShareByFileId, deleteCompanyShare } from '../../services/storage';
import './ShareModal.scss';

export const ShareModal = ({ item, onClose }) => {
  const { user } = useAuth();
  const [shareLink, setShareLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [shareType, setShareType] = useState('public'); // 'public' ou 'company'
  const [isCompanyShared, setIsCompanyShared] = useState(false);

  useEffect(() => {
    if (item) {
      // Vérifier si le fichier est déjà partagé avec la boîte
      const companyShare = getCompanyShareByFileId(item.id);
      if (companyShare) {
        setIsCompanyShared(true);
        setShareType('company');
      } else {
        const existing = getShareLinkByFileId(item.id);
        if (existing) {
          setShareLink(existing);
          setShareType('public');
        } else {
          // Créer un nouveau lien
          const token = Math.random().toString(36).substring(2, 15);
          const newLink = {
            id: Date.now().toString(),
            fichierId: item.id,
            token,
            url: `${window.location.origin}/s/${token}`,
            actif: false, // Par défaut inactif
          };
          saveShareLink(newLink);
          setShareLink(newLink);
        }
      }
    }
  }, [item]);

  const handleToggle = () => {
    if (shareLink) {
      const updated = { ...shareLink, actif: !shareLink.actif };
      saveShareLink(updated);
      setShareLink(updated);
    }
  };

  const handleCopy = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!item || !shareLink) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Partager "{item.nom}"</h2>
        
        <div className="form-group">
          <label>Type de partage</label>
          <div className="share-type-selector">
            <button
              type="button"
              className={`share-type-btn ${shareType === 'public' ? 'active' : ''}`}
              onClick={() => setShareType('public')}
            >
              🔗 Lien public
            </button>
            <button
              type="button"
              className={`share-type-btn ${shareType === 'company' ? 'active' : ''}`}
              onClick={() => setShareType('company')}
            >
              🏢 Toute la boîte
            </button>
          </div>
        </div>

        {shareType === 'public' && (
          <>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={shareLink.actif}
                  onChange={handleToggle}
                />
                Activer le lien de partage
              </label>
            </div>

            {shareLink.actif && (
              <div className="form-group">
                <label>Lien de partage</label>
                <div className="share-link-input">
                  <input
                    type="text"
                    value={shareLink.url}
                    readOnly
                    className="share-url"
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleCopy}
                  >
                    {copied ? '✓ Copié' : 'Copier'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {shareType === 'company' && (
          <div className="form-group">
            <div className="company-share-info">
              {isCompanyShared ? (
                <>
                  <p>✅ Ce fichier est déjà partagé avec toute la boîte.</p>
                  <p className="info-text">Tous les membres peuvent voir et accéder à ce fichier.</p>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => {
                      const companyShare = getCompanyShareByFileId(item.id);
                      if (companyShare) {
                        deleteCompanyShare(companyShare.id);
                        setIsCompanyShared(false);
                        // Désactiver aussi le lien public si présent
                        if (shareLink) {
                          const updated = { ...shareLink, actif: false };
                          saveShareLink(updated);
                          setShareLink(updated);
                        }
                      }
                    }}
                  >
                    Arrêter le partage avec la boîte
                  </button>
                </>
              ) : (
                <>
                  <p>📢 Ce fichier sera partagé avec tous les utilisateurs de l'entreprise.</p>
                  <p className="info-text">Tous les membres pourront voir et accéder à ce fichier.</p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      if (user) {
                        const newCompanyShare = {
                          id: Date.now().toString(),
                          fichierId: item.id,
                          sharedByUserId: user.id,
                          sharedByUserName: `${user.prenom} ${user.nom}`,
                          datePartage: new Date().toISOString(),
                          actif: true,
                        };
                        saveCompanyShare(newCompanyShare);
                        setIsCompanyShared(true);
                        // Désactiver le lien public si présent
                        if (shareLink) {
                          const updated = { ...shareLink, actif: false };
                          saveShareLink(updated);
                          setShareLink(updated);
                        }
                        // Déclencher un événement pour mettre à jour les autres pages
                        window.dispatchEvent(new Event('companyShareUpdated'));
                      }
                    }}
                  >
                    Partager avec toute la boîte
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

