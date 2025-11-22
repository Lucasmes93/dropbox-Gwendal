// Utilitaire pour nettoyer toutes les données d'exemple du localStorage
// À exécuter une fois pour nettoyer complètement

export const clearExampleData = () => {
  const keysToCheck = [
    'monDrive_files',
    'monDrive_fileContents',
    'monDrive_shareLinks',
    'monDrive_calendar',
    'monDrive_contacts',
    'monDrive_notes',
    'monDrive_tasks',
    'monDrive_boards',
    'monDrive_activities',
    'monDrive_notifications',
    'monDrive_chats',
    'monDrive_messages',
  ];

  keysToCheck.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        const parsed = JSON.parse(value);
        // Si c'est un tableau vide, le supprimer
        if (Array.isArray(parsed) && parsed.length === 0) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
    }
  });

  // Nettoyer aussi les clés dynamiques vides
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('monDrive_fileContent_') ||
      key.startsWith('monDrive_messages_') ||
      key.startsWith('monDrive_collaborators_')
    )) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.length === 0) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        // Ignorer les erreurs de parsing
      }
    }
  }
};

