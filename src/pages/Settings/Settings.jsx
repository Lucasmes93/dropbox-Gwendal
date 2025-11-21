import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { 
  selectSyncFolder, 
  syncBidirectional, 
  startAutoSync, 
  stopAutoSync, 
  getSyncStatus,
  resetSync,
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

  useEffect(() => {
    loadSyncStatus();
    
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

  const handleSelectFolder = async () => {
    if (!isFileSystemAccessSupported()) {
      alert('Cette fonctionnalité nécessite Chrome, Edge ou Opera. L\'API File System Access n\'est pas supportée par votre navigateur.');
      return;
    }

    setIsSelecting(true);
    try {
      const result = await selectSyncFolder();
      if (result.success) {
        // Après sélection du dossier, proposer une synchronisation immédiate
        const shouldSync = confirm(
          `Dossier sélectionné : ${result.folderName}\n\n` +
          `Voulez-vous synchroniser maintenant ?\n` +
          `(Cela copiera tous les fichiers du dossier vers l'application)`
        );
        
        if (shouldSync) {
          setIsSyncing(true);
          setSyncProgress({ total: 0, current: 0, status: 'Démarrage de la synchronisation...' });
          
          try {
            const syncResult = await syncBidirectional((progress) => {
              setSyncProgress(progress);
            });
            
            if (syncResult.success) {
              alert(
                `Synchronisation terminée !\n\n` +
                `✓ ${syncResult.fromLocal.syncedCount} fichiers importés depuis le dossier local\n` +
                `✓ ${syncResult.toLocal.syncedCount} fichiers synchronisés vers le dossier local\n\n` +
                `Tous les fichiers sont maintenant disponibles dans l'application.`
              );
            } else {
              alert(`Erreur lors de la synchronisation : ${syncResult.error}`);
            }
          } catch (syncError) {
            alert(`Erreur lors de la synchronisation : ${syncError.message}`);
          } finally {
            setIsSyncing(false);
            setSyncProgress(null);
          }
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
              <li>L'entreprise dépose ses fichiers dans un dossier sur votre ordinateur (ex: C:\Entreprise\Documents)</li>
              <li>Vous sélectionnez ce dossier dans l'application</li>
              <li>La synchronisation copie automatiquement tous les fichiers du dossier vers l'application</li>
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
              {syncStatus?.hasFolder ? (
                <div className="sync-folder-info">
                  <span>✓ Dossier sélectionné</span>
                  {syncStatus.syncPath && <span className="sync-path">{syncStatus.syncPath}</span>}
                </div>
              ) : (
                <p className="sync-no-folder">Aucun dossier sélectionné</p>
              )}
              <button 
                onClick={handleSelectFolder} 
                disabled={isSelecting || !isFileSystemAccessSupported()}
                className="btn-primary"
              >
                {isSelecting ? 'Sélection en cours...' : 'Sélectionner un dossier'}
              </button>
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
