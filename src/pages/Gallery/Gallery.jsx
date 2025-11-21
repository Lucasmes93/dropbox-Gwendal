import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { UploadModal } from '../../components/UploadModal/UploadModal';
import { saveFileContent, getFileContent, base64ToBlob, deleteFileContent } from '../../services/storage';
import './Gallery.scss';

export const Gallery = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [view, setView] = useState('grid');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    loadImages();
    
    // Écouter les mises à jour des fichiers
    const handleFilesUpdate = () => {
      loadImages();
    };
    
    window.addEventListener('filesUpdated', handleFilesUpdate);
    return () => {
      window.removeEventListener('filesUpdated', handleFilesUpdate);
    };
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

  const handleDeleteImage = (image, e) => {
    e.stopPropagation(); // Empêcher l'ouverture de la lightbox
    
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${image.nom}" ?`)) {
      return;
    }

    try {
      // Supprimer le contenu de l'image
      deleteFileContent(image.id);

      // Marquer l'image comme supprimée dans la liste des fichiers
      const saved = localStorage.getItem('monDrive_files');
      if (saved) {
        const allFiles = JSON.parse(saved);
        const updatedFiles = allFiles.map(f =>
          f.id === image.id ? { ...f, estSupprime: true } : f
        );
        localStorage.setItem('monDrive_files', JSON.stringify(updatedFiles));
      }

      // Déclencher l'événement de mise à jour
      window.dispatchEvent(new Event('filesUpdated'));

      // Recharger les images
      loadImages();

      // Fermer la lightbox si l'image supprimée était sélectionnée
      if (selectedImage && selectedImage.id === image.id) {
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'image:', error);
      alert('Erreur lors de la suppression de l\'image');
    }
  };

  // Fonction pour compresser une image
  const compressImage = (file, maxWidth = 1280, maxHeight = 1280, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionner si nécessaire
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            } else {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Erreur lors de la compression'));
              }
            },
            file.type,
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Fonction pour nettoyer les anciennes images si nécessaire
  const cleanupOldImages = async () => {
    try {
      const saved = localStorage.getItem('monDrive_files');
      if (!saved) return;
      
      const allFiles = JSON.parse(saved);
      const imageFiles = allFiles.filter(f =>
        !f.estSupprime &&
        f.type === 'fichier' &&
        (f.mimeType?.startsWith('image/') ||
         f.extension?.toLowerCase().match(/^(jpg|jpeg|png|gif|webp|svg|bmp)$/))
      );
      
      // Si on a plus de 20 images, supprimer les plus anciennes
      if (imageFiles.length > 20) {
        const sortedImages = imageFiles.sort((a, b) => 
          new Date(a.dateModification).getTime() - new Date(b.dateModification).getTime()
        );
        
        // Supprimer les 5 plus anciennes
        const toDelete = sortedImages.slice(0, 5);
        for (const img of toDelete) {
          deleteFileContent(img.id);
          // Marquer comme supprimé dans la liste des fichiers
          const index = allFiles.findIndex(f => f.id === img.id);
          if (index !== -1) {
            allFiles[index].estSupprime = true;
          }
        }
        
        localStorage.setItem('monDrive_files', JSON.stringify(allFiles));
        window.dispatchEvent(new Event('filesUpdated'));
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
    }
  };

  const handleUploadImage = async (file) => {
    // Vérifier que c'est bien une image
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    // Limiter la taille maximale à 10MB avant compression
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      alert('L\'image est trop volumineuse. Taille maximale: 10MB');
      return;
    }

    try {
      // Nettoyer les anciennes images si nécessaire avant d'uploader
      await cleanupOldImages();
      
      // Compresser l'image avant de la sauvegarder (compression plus agressive)
      const compressedBlob = await compressImage(file, 1280, 1280, 0.7);

      // Convertir le blob en File pour la sauvegarde
      const compressedFile = new File([compressedBlob], file.name, { type: file.type });

      const fileId = Date.now().toString();
      const newImage = {
        id: fileId,
        nom: file.name,
        type: 'fichier',
        taille: compressedFile.size,
        dateModification: new Date().toISOString(),
        extension: file.name.split('.').pop()?.toLowerCase(),
        parentId: undefined,
        mimeType: file.type,
        tags: [],
      };

      // Sauvegarder le contenu de l'image compressée
      await saveFileContent(fileId, compressedFile);

      // Ajouter l'image à la liste des fichiers
      const saved = localStorage.getItem('monDrive_files');
      const allFiles = saved ? JSON.parse(saved) : [];
      allFiles.push(newImage);
      localStorage.setItem('monDrive_files', JSON.stringify(allFiles));

      // Déclencher l'événement de mise à jour
      window.dispatchEvent(new Event('filesUpdated'));

      // Recharger les images
      loadImages();
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
      if (error.name === 'QuotaExceededError' || error.message?.includes('QuotaExceededError')) {
        const message = 'L\'espace de stockage est plein.\n\n' +
          'Pour libérer de l\'espace, vous pouvez :\n' +
          '• Supprimer des images anciennes dans la galerie\n' +
          '• Supprimer des fichiers dans "Tous les fichiers"\n' +
          '• Vider la corbeille\n\n' +
          'Les images sont automatiquement compressées, mais le stockage local est limité.';
        alert(message);
      } else {
        alert('Erreur lors de l\'upload de l\'image: ' + error.message);
      }
    }
  };

  return (
    <Layout>
      <div className="gallery-page">
        <div className="gallery-header">
          <h1>Photos</h1>
          <div className="gallery-controls">
            <button
              className="btn-primary"
              onClick={() => setUploadModalOpen(true)}
            >
              📤 Ajouter une photo
            </button>
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
                  <button
                    className="gallery-delete-btn"
                    onClick={(e) => handleDeleteImage(image, e)}
                    title="Supprimer l'image"
                  >
                    🗑️
                  </button>
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
                  <button
                    className="gallery-delete-btn"
                    onClick={(e) => handleDeleteImage(image, e)}
                    title="Supprimer l'image"
                  >
                    🗑️
                  </button>
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
                <button
                  className="btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteImage(selectedImage, e);
                    setSelectedImage(null);
                  }}
                >
                  🗑️ Supprimer cette image
                </button>
              </div>
            </div>
          </div>
        )}

        {uploadModalOpen && (
          <UploadModal
            onClose={() => setUploadModalOpen(false)}
            onUpload={handleUploadImage}
            accept="image/*"
            title="Téléverser une photo"
          />
        )}
      </div>
    </Layout>
  );
};

