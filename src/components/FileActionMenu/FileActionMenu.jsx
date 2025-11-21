import { useRef, useEffect } from 'react';
import './FileActionMenu.scss';

export const FileActionMenu = ({ file, item, position, onClose, onOpen, onEdit, onDownload, onRename, onDelete, onShare, onFavorite }) => {
  const fileItem = file || item;
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!fileItem) return null;

  const handleAction = (action) => {
    if (action) action();
    onClose();
  };

  return (
    <div
      className="file-action-menu"
      ref={menuRef}
      style={{
        position: 'fixed',
        top: position?.y || 0,
        left: position?.x || 0,
        zIndex: 1000,
      }}
    >
      {fileItem.type === 'fichier' ? (
        <>
          {onEdit && (
            <button onClick={() => handleAction(onEdit)} className="menu-item">
              📂 Éditer
            </button>
          )}
          {onOpen && (
            <button onClick={() => handleAction(onOpen)} className="menu-item">
              📂 Ouvrir
            </button>
          )}
          {onDownload && (
            <button onClick={() => handleAction(onDownload)} className="menu-item">
              ⬇️ Télécharger
            </button>
          )}
        </>
      ) : (
        onOpen && (
          <button onClick={() => handleAction(onOpen)} className="menu-item">
            📂 Ouvrir
          </button>
        )
      )}
      {onRename && (
        <button onClick={() => handleAction(onRename)} className="menu-item">
          ✏️ Renommer
        </button>
      )}
      {onFavorite && (
        <button onClick={() => handleAction(onFavorite)} className="menu-item">
          {fileItem.estFavori ? '⭐ Retirer des favoris' : '⭐ Ajouter aux favoris'}
        </button>
      )}
      {onShare && (
        <button onClick={() => handleAction(onShare)} className="menu-item">
          🔗 Partager
        </button>
      )}
      {onDelete && (
        <>
          <div className="menu-divider" />
          <button onClick={() => handleAction(onDelete)} className="menu-item menu-item-danger">
            🗑️ Supprimer
          </button>
        </>
      )}
    </div>
  );
};

