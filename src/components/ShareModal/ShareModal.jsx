import { useState, useEffect } from 'react';
import { saveShareLink, getShareLinkByFileId } from '../../services/storage';
import './ShareModal.scss';

export const ShareModal = ({ item, onClose }) => {
  const [shareLink, setShareLink] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (item) {
      const existing = getShareLinkByFileId(item.id);
      if (existing) {
        setShareLink(existing);
      } else {
        // Créer un nouveau lien
        const token = Math.random().toString(36).substring(2, 15);
        const newLink = {
          id: Date.now().toString(),
          fichierId: item.id,
          token,
          url: `${window.location.origin}/s/${token}`,
          actif: true,
        };
        saveShareLink(newLink);
        setShareLink(newLink);
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
          <>
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
          </>
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

