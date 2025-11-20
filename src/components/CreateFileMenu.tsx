import { useState, useRef, useEffect } from 'react';
import '../styles/CreateFileMenu.css';

interface CreateFileMenuProps {
  onClose: () => void;
  onCreateFile: (type: 'word' | 'excel' | 'powerpoint' | 'text') => void;
  onCreateFolder: () => void;
  onUpload: () => void;
}

export const CreateFileMenu = ({ onClose, onCreateFile, onCreateFolder, onUpload }: CreateFileMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="create-file-menu" ref={menuRef}>
      <button className="create-menu-item" onClick={onUpload}>
        <span className="create-menu-icon">⬆️</span>
        Téléverser un fichier
      </button>
      <button className="create-menu-item" onClick={onCreateFolder}>
        <span className="create-menu-icon">📁</span>
        Nouveau dossier
      </button>
      <button className="create-menu-item" onClick={() => onCreateFile('text')}>
        <span className="create-menu-icon">📄</span>
        Nouveau fichier texte
      </button>
      <button className="create-menu-item" onClick={() => onCreateFile('word')}>
        <span className="create-menu-icon">📝</span>
        Nouveau document
      </button>
      <button className="create-menu-item" onClick={() => onCreateFile('excel')}>
        <span className="create-menu-icon">📊</span>
        Nouvelle feuille de calcul
      </button>
      <button className="create-menu-item" onClick={() => onCreateFile('powerpoint')}>
        <span className="create-menu-icon">📽️</span>
        Nouvelle présentation
      </button>
    </div>
  );
};

