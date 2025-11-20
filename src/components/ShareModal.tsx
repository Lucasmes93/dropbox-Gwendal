import { useState } from 'react';
import type { FileItem } from '../types';
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

  const generateLink = () => {
    const token = Math.random().toString(36).substring(2, 15);
    const link = `${window.location.origin}/s/${token}`;
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
      setLinkEnabled(false);
      setShareLink('');
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
                  onChange={(e) => setExpiration(e.target.value)}
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

