import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { 
  selectMainFolder,
  selectSubFolder,
  listSubFolders,
  syncBidirectional, 
  startAutoSync, 
  stopAutoSync, 
  getSyncStatus,
  resetSync,
  getSyncPath,
  isFileSystemAccessSupported 
} from '../../services/folderSync';
import './Settings.scss';

export const Settings = () => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState(30); // en secondes
  const [mainFolderHandle, setMainFolderHandle] = useState(null);
  const [subFolders, setSubFolders] = useState([]);
  const [selectedSubFolder, setSelectedSubFolder] = useState(null);
  const [isLoadingSubFolders, setIsLoadingSubFolders] = useState(false);

  useEffect(() => {
    loadSyncStatus();
    
    // Charger le sous-dossier sélectionné depuis localStorage
    const savedSubFolder = localStorage.getItem('monDrive_syncSubFolderPath');
    if (savedSubFolder) {
      setSelectedSubFolder(savedSubFolder);
    }
    
    // Écouter les événements de synchronisation arrêtée
    const handleSyncStopped = (e) => {
      const customEvent = e;
      if (customEvent.detail?.reason) {
        alert(`Synchronisation arrêtée : ${customEvent.detail.reason}`);
        setAutoSyncEnabled(false);
        loadSyncStatus();
      }
    };

    window.addEventListener('syncStopped', handleSyncStopped);
    
    // Vérifier le statut périodiquement
    const interval = setInterval(loadSyncStatus, 2000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('syncStopped', handleSyncStopped);
    };
  }, []);

  const loadSyncStatus = () => {
    const status = getSyncStatus();
    setSyncStatus(status);
    setAutoSyncEnabled(status.isActive);
  };

  const handleSelectMainFolder = async () => {
    if (!isFileSystemAccessSupported()) {
      alert('Cette fonctionnalité nécessite Chrome, Edge ou Opera. L\'API File System Access n\'est pas supportée par votre navigateur.');
      return;
    }

    setIsSelecting(true);
    try {
      const result = await selectMainFolder();
      if (result.success) {
        setMainFolderHandle(result.handle);
        
        // Charger la liste des sous-dossiers
        setIsLoadingSubFolders(true);
        try {
          const folders = await listSubFolders(result.handle);
          setSubFolders(folders);
          
          if (folders.length > 0) {
            const subFolderChoice = confirm(
              `Dossier principal sélectionné : ${result.folderName}\n\n` +
              `Voulez-vous synchroniser un sous-dossier spécifique ?\n\n` +
              `Sous-dossiers disponibles :\n${folders.slice(0, 10).map(f => `- ${f}`).join('\n')}${folders.length > 10 ? `\n... et ${folders.length - 10} autres` : ''}\n\n` +
              `Cliquez sur "OK" pour choisir un sous-dossier, ou "Annuler" pour synchroniser tout le dossier principal.`
            );
            
            if (subFolderChoice) {
              // Afficher un prompt pour choisir le sous-dossier
              const subFolderName = prompt(
                `Entrez le nom du sous-dossier à synchroniser :\n\n` +
                `Sous-dossiers disponibles :\n${folders.map(f => `- ${f}`).join('\n')}`
              );
              
              if (subFolderName && folders.includes(subFolderName)) {
                const subResult = await selectSubFolder(result.handle, subFolderName);
                if (subResult.success) {
                  setSelectedSubFolder(subFolderName);
                  alert(`Sous-dossier sélectionné : ${subFolderName}\n\nLa synchronisation se fera uniquement dans ce dossier.`);
                } else {
                  alert(`Erreur : ${subResult.error}`);
                }
              } else if (subFolderName) {
                alert(`Le sous-dossier "${subFolderName}" n'existe pas dans le dossier principal.`);
              }
            }
          } else {
            alert(`Dossier principal sélectionné : ${result.folderName}\n\nAucun sous-dossier trouvé. La synchronisation se fera sur tout le dossier principal.`);
          }
        } catch (error) {
          alert(`Erreur lors du chargement des sous-dossiers : ${error.message}`);
        } finally {
          setIsLoadingSubFolders(false);
        }
        
        loadSyncStatus();
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      alert(`Erreur : ${error.message}`);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncProgress({ total: 0, current: 0, status: 'Démarrage...' });

    try {
      const result = await syncBidirectional((progress) => {
        setSyncProgress(progress);
      });

      if (result.success) {
        alert(`Synchronisation terminée !\n- ${result.fromLocal.syncedCount} fichiers synchronisés depuis le dossier local\n- ${result.toLocal.syncedCount} fichiers synchronisés vers le dossier local`);
      } else {
        alert(`Erreur : ${result.error}`);
      }
    } catch (error) {
      alert(`Erreur : ${error.message}`);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
      loadSyncStatus();
    }
  };

  const handleToggleAutoSync = async (e) => {
    // Empêcher le comportement par défaut si la checkbox est désactivée
    if (!syncStatus?.hasFolder) {
      e.preventDefault();
      alert('Veuillez d\'abord sélectionner un dossier de synchronisation en cliquant sur "Sélectionner un dossier"');
      return;
    }

    if (autoSyncEnabled) {
      stopAutoSync();
      setAutoSyncEnabled(false);
      loadSyncStatus();
    } else {
      try {
        await startAutoSync(syncInterval * 1000);
        setAutoSyncEnabled(true);
        alert('Synchronisation automatique activée !\n\nLa synchronisation se fera automatiquement toutes les ' + syncInterval + ' secondes.');
      } catch (error) {
        // Si l'erreur indique qu'il faut re-sélectionner le dossier
        if (error.message && error.message.includes('re-sélectionner')) {
          alert('Le dossier de synchronisation doit être re-sélectionné.\n\nVeuillez cliquer sur "Sélectionner un dossier" puis réessayer.');
        } else {
          alert(`Erreur : ${error.message}`);
        }
        setAutoSyncEnabled(false);
        // Forcer la mise à jour de l'état
        const updatedStatus = getSyncStatus();
        setSyncStatus(updatedStatus);
      }
      loadSyncStatus();
    }
  };

  const handleResetSync = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser la synchronisation ? Cela supprimera la référence au dossier sélectionné.')) {
      resetSync();
      setAutoSyncEnabled(false);
      loadSyncStatus();
    }
  };

  return (
    <Layout>
      <div className="settings">
        <h1>Paramètres</h1>

        <section className="settings-section">
          <h2>Synchronisation avec dossier local</h2>
          <p className="settings-description">
            Synchronisez automatiquement vos fichiers avec un dossier sur votre disque dur.
            <br /><br />
            <strong>Comment ça fonctionne :</strong>
            <ol style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><strong>Étape 1 :</strong> L'entreprise dépose ses fichiers dans un dossier principal sur votre ordinateur (ex: C:\Entreprise\Documents)</li>
              <li><strong>Étape 2 :</strong> Vous sélectionnez ce dossier principal dans l'application</li>
              <li><strong>Étape 3 :</strong> Vous choisissez un sous-dossier spécifique à synchroniser (ex: "ProjetX") - optionnel, vous pouvez synchroniser tout le dossier principal</li>
              <li><strong>Étape 4 :</strong> Activez la synchronisation automatique</li>
              <li><strong>Résultat :</strong> Tous les fichiers du dossier/sous-dossier sélectionné sont automatiquement synchronisés avec l'application toutes les X secondes</li>
              <li>Les modifications dans l'application sont aussi synchronisées vers le dossier local</li>
            </ol>
            <br />
            Cette fonctionnalité nécessite Chrome, Edge ou Opera (API File System Access).
          </p>

          {!isFileSystemAccessSupported() && (
            <div className="settings-warning">
              ⚠️ Votre navigateur ne supporte pas l'API File System Access.
              Utilisez Chrome, Edge ou Opera pour activer cette fonctionnalité.
            </div>
          )}

          <div className="sync-controls">
            <div className="sync-folder-selection">
              <h3>Dossier de synchronisation</h3>
              <p className="settings-description" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                <strong>Étape 1 :</strong> Sélectionnez le dossier principal de l'entreprise (ex: C:\Entreprise\Documents)
                <br />
                <strong>Étape 2 :</strong> Choisissez un sous-dossier spécifique à synchroniser (optionnel)
                <br />
                <strong>Étape 3 :</strong> Activez la synchronisation automatique
              </p>
              
              {syncStatus?.hasFolder ? (
                <div className="sync-folder-info">
                  <span>✓ Dossier principal sélectionné</span>
                  {syncStatus.syncPath && (
                    <span className="sync-path">
                      {getSyncPath() || syncStatus.syncPath}
                      {selectedSubFolder && ` (sous-dossier: ${selectedSubFolder})`}
                    </span>
                  )}
                </div>
              ) : (
                <p className="sync-no-folder">Aucun dossier sélectionné</p>
              )}
              
              <button 
                onClick={handleSelectMainFolder} 
                disabled={isSelecting || isLoadingSubFolders || !isFileSystemAccessSupported()}
                className="btn-primary"
              >
                {isSelecting ? 'Sélection en cours...' : isLoadingSubFolders ? 'Chargement des sous-dossiers...' : 'Sélectionner le dossier principal'}
              </button>
              
              {subFolders.length > 0 && mainFolderHandle && (
                <div className="sync-subfolder-selection" style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
                  <h4>Sous-dossiers disponibles :</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {subFolders.map(folder => (
                      <button
                        key={folder}
                        onClick={async () => {
                          const result = await selectSubFolder(mainFolderHandle, folder);
                          if (result.success) {
                            setSelectedSubFolder(folder);
                            alert(`Sous-dossier sélectionné : ${folder}\n\nLa synchronisation se fera uniquement dans ce dossier.`);
                            loadSyncStatus();
                          } else {
                            alert(`Erreur : ${result.error}`);
                          }
                        }}
                        className={`btn-secondary ${selectedSubFolder === folder ? 'active' : ''}`}
                        style={{ 
                          fontSize: '0.875rem',
                          padding: '0.5rem 1rem',
                          ...(selectedSubFolder === folder && { background: '#2196f3', color: 'white' })
                        }}
                      >
                        {folder}
                      </button>
                    ))}
                  </div>
                  {selectedSubFolder && (
                    <p style={{ marginTop: '0.5rem', color: '#4caf50', fontWeight: 'bold' }}>
                      ✓ Synchronisation active sur : {selectedSubFolder}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="sync-actions">
              <h3>Synchronisation manuelle</h3>
              <button 
                onClick={handleSyncNow} 
                disabled={isSyncing || !syncStatus?.hasFolder}
                className="btn-primary"
              >
                {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
              </button>
              
              {syncProgress && (
                <div className="sync-progress">
                  <div className="sync-progress-bar">
                    <div 
                      className="sync-progress-fill"
                      style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="sync-progress-text">
                    {syncProgress.status} ({syncProgress.current}/{syncProgress.total})
                  </p>
                </div>
              )}

              {syncStatus?.lastSyncTime && (
                <p className="sync-last-time">
                  Dernière synchronisation : {new Date(syncStatus.lastSyncTime).toLocaleString('fr-FR')}
                </p>
              )}
            </div>

            <div className="sync-auto">
              <h3>Synchronisation automatique</h3>
              {!syncStatus?.hasFolder && (
                <p className="sync-help-text">
                  ℹ️ Vous devez d'abord sélectionner un dossier pour activer la synchronisation automatique.
                </p>
              )}
              <div className="sync-auto-controls">
                <label className="sync-toggle">
                  <input 
                    type="checkbox" 
                    checked={autoSyncEnabled}
                    onChange={handleToggleAutoSync}
                    disabled={!syncStatus?.hasFolder || isSelecting}
                  />
                  <span>Activer la synchronisation automatique</span>
                </label>
                
                {autoSyncEnabled && (
                  <div className="sync-interval">
                    <label>
                      Intervalle (secondes) :
                      <input 
                        type="number" 
                        min="10" 
                        max="3600" 
                        value={syncInterval}
                        onChange={(e) => setSyncInterval(parseInt(e.target.value) || 30)}
                        disabled={!autoSyncEnabled}
                      />
                    </label>
                    <button 
                      onClick={() => {
                        stopAutoSync();
                        startAutoSync(syncInterval * 1000);
                      }}
                      className="btn-secondary"
                    >
                      Appliquer
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="sync-reset">
              <button 
                onClick={handleResetSync}
                className="btn-danger"
              >
                Réinitialiser la synchronisation
              </button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};
