import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { getFileContent, base64ToBlob } from '../../services/storage';
import './Gallery.scss';

export const Gallery = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [view, setView] = useState('grid');

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = () => {
    try {
      const saved = localStorage.getItem('monDrive_files');
      if (saved) {
        const allFiles = JSON.parse(saved);
        const imageFiles = allFiles.filter(f =>
          !f.estSupprime &&
          f.type === 'fichier' &&
          (f.mimeType?.startsWith('image/') ||
           f.extension?.toLowerCase().match(/^(jpg|jpeg|png|gif|webp|svg|bmp)$/))
        );
        setImages(imageFiles);
      } else {
        // Exemples d'images (simulées)
        const exampleImages = [
          {
            id: 'img1',
            nom: 'photo_vacances.jpg',
            type: 'fichier',
            taille: 3145728,
            extension: 'jpg',
            mimeType: 'image/jpeg',
            dateModification: new Date().toISOString(),
          },
          {
            id: 'img2',
            nom: 'logo_entreprise.png',
            type: 'fichier',
            taille: 524288,
            extension: 'png',
            mimeType: 'image/png',
            dateModification: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 'img3',
            nom: 'screenshot_app.png',
            type: 'fichier',
            taille: 1048576,
            extension: 'png',
            mimeType: 'image/png',
            dateModification: new Date(Date.now() - 172800000).toISOString(),
          },
        ];
        setImages(exampleImages);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getImageUrl = (file) => {
    const fileContent = getFileContent(file.id);
    if (fileContent) {
      return fileContent; // base64
    }
    return null;
  };

  return (
    <Layout>
      <div className="gallery-page">
        <div className="gallery-header">
          <h1>Photos</h1>
          <div className="gallery-controls">
            <button
              className={`view-btn ${view === 'grid' ? 'active' : ''}`}
              onClick={() => setView('grid')}
            >
              ⬜ Grille
            </button>
            <button
              className={`view-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              ☰ Liste
            </button>
          </div>
        </div>

        {view === 'grid' ? (
          <div className="gallery-grid">
            {images.map(image => {
              const imageUrl = getImageUrl(image);
              return (
                <div
                  key={image.id}
                  className="gallery-item"
                  onClick={() => setSelectedImage(image)}
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt={image.nom} />
                  ) : (
                    <div className="gallery-placeholder">📷</div>
                  )}
                  <div className="gallery-item-overlay">
                    <span>{image.nom}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="gallery-list">
            {images.map(image => {
              const imageUrl = getImageUrl(image);
              return (
                <div
                  key={image.id}
                  className="gallery-list-item"
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="gallery-list-thumb">
                    {imageUrl ? (
                      <img src={imageUrl} alt={image.nom} />
                    ) : (
                      <div className="gallery-placeholder">📷</div>
                    )}
                  </div>
                  <div className="gallery-list-info">
                    <h3>{image.nom}</h3>
                    <p>{new Date(image.dateModification).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {images.length === 0 && (
          <div className="empty-state">Aucune photo</div>
        )}

        {selectedImage && (
          <div className="gallery-lightbox" onClick={() => setSelectedImage(null)}>
            <div className="gallery-lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button className="lightbox-close" onClick={() => setSelectedImage(null)}>
                ✕
              </button>
              {getImageUrl(selectedImage) && (
                <img src={getImageUrl(selectedImage)} alt={selectedImage.nom} />
              )}
              <div className="lightbox-info">
                <h3>{selectedImage.nom}</h3>
                <p>{new Date(selectedImage.dateModification).toLocaleString('fr-FR')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

