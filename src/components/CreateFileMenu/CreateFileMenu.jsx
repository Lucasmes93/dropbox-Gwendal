import { useRef, useEffect } from 'react';
import './CreateFileMenu.scss';

export const CreateFileMenu = ({ isOpen = true, onClose, onCreateFile, onCreateFolder, onUpload }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="create-file-menu" ref={menuRef}>
      <button onClick={onUpload} className="menu-item">
        📤 Téléverser un fichier
      </button>
      <div className="menu-divider" />
      <button onClick={() => onCreateFile('word')} className="menu-item">
        📄 Document Word
      </button>
      <button onClick={() => onCreateFile('excel')} className="menu-item">
        📊 Feuille de calcul
      </button>
      <button onClick={() => onCreateFile('powerpoint')} className="menu-item">
        📽️ Présentation
      </button>
      <button onClick={() => onCreateFile('text')} className="menu-item">
        📝 Fichier texte
      </button>
      <div className="menu-divider" />
      <button onClick={onCreateFolder} className="menu-item">
        📁 Nouveau dossier
      </button>
    </div>
  );
};

