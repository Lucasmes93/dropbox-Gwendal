import { useState, useEffect } from 'react';
import type { FileItem, ShareLink } from '../types';
import { saveShareLink, getShareLink, deleteShareLink, getAllShareLinks } from '../services/storage';
import '../styles/Modal.css';

interface ShareModalProps {
  item: FileItem;
  onClose: () => void;
}

export const ShareModal = ({ item, onClose }: ShareModalProps) => {
  const [linkEnabled, setLinkEnabled] = useState(false);
  const [expiration, setExpiration] = useState('7');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  // Vérifier si un lien existe déjà pour ce fichier
  useEffect(() => {
    const existingLinks = getAllShareLinks();
    const existingLink = existingLinks.find(link => link.fichierId === item.id && link.actif);
    if (existingLink) {
      setCurrentToken(existingLink.token);
      setShareLink(`${window.location.origin}/s/${existingLink.token}`);
      setLinkEnabled(true);
      if (existingLink.dateExpiration) {
        const days = Math.ceil((new Date(existingLink.dateExpiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days > 0) {
          setExpiration(days.toString());
        }
      }
    }
  }, [item.id]);

  const generateLink = () => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const link = `${window.location.origin}/s/${token}`;
    
    // Calculer la date d'expiration
    let dateExpiration: string | undefined;
    if (expiration !== '0') {
      const days = parseInt(expiration);
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + days);
      dateExpiration = expDate.toISOString();
    }

    const shareLinkData: ShareLink = {
      id: Date.now().toString(),
      fichierId: item.id,
      token,
      url: link,
      dateExpiration,
      actif: true,
    };

    saveShareLink(shareLinkData);
    setCurrentToken(token);
    setShareLink(link);
    setLinkEnabled(true);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = () => {
    if (!linkEnabled) {
      generateLink();
    } else {
      // Désactiver le lien
      if (currentToken) {
        const link = getShareLink(currentToken);
        if (link) {
          const updatedLink: ShareLink = { ...link, actif: false };
          saveShareLink(updatedLink);
        }
      }
      setLinkEnabled(false);
      setShareLink('');
      setCurrentToken(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Partager : {item.nom}</h2>

        <div className="share-content">
          <div className="share-toggle">
            <label>
              <input
                type="checkbox"
                checked={linkEnabled}
                onChange={handleToggle}
              />
              Activer le lien de partage
            </label>
          </div>

          {linkEnabled && (
            <>
              <div className="form-group">
                <label htmlFor="expiration">Date d'expiration</label>
                <select
                  id="expiration"
                  value={expiration}
                  onChange={(e) => {
                    setExpiration(e.target.value);
                    // Mettre à jour la date d'expiration du lien existant
                    if (currentToken && linkEnabled) {
                      const link = getShareLink(currentToken);
                      if (link) {
                        let dateExpiration: string | undefined;
                        if (e.target.value !== '0') {
                          const days = parseInt(e.target.value);
                          const expDate = new Date();
                          expDate.setDate(expDate.getDate() + days);
                          dateExpiration = expDate.toISOString();
                        }
                        const updatedLink: ShareLink = { ...link, dateExpiration };
                        saveShareLink(updatedLink);
                      }
                    }
                  }}
                >
                  <option value="7">7 jours</option>
                  <option value="30">30 jours</option>
                  <option value="0">Illimité</option>
                </select>
              </div>

              <div className="form-group">
                <label>Lien de partage</label>
                <div className="link-container">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="link-input"
                  />
                  <button className="btn-secondary" onClick={copyLink}>
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              </div>

              <p className="info-text">
                Ce lien permet à toute personne qui le possède de télécharger le fichier.
              </p>
            </>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

