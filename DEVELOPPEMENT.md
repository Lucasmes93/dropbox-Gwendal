# Guide de développement

Guide complet pour les développeurs travaillant sur le projet SPIREST MEDICAL Cloud Storage.

## 📋 Table des matières

1. [Architecture](#architecture)
2. [Technologies utilisées](#technologies-utilisées)
3. [Structure du code](#structure-du-code)
4. [Configuration de l'environnement](#configuration-de-lenvironnement)
5. [Conventions de code](#conventions-de-code)
6. [API Backend](#api-backend)
7. [Services Frontend](#services-frontend)
8. [WebSocket](#websocket)
9. [Tests](#tests)
10. [Débogage](#débogage)

## 🏗️ Architecture

### Frontend
- **Framework** : React 19 avec TypeScript
- **Build** : Vite
- **Routing** : React Router DOM 7
- **Styling** : SCSS/Sass
- **State Management** : React Context API
- **Communication** : Fetch API + WebSocket

### Backend
- **Framework** : Node.js avec Express.js
- **Authentification** : JWT (jsonwebtoken)
- **Hachage** : bcryptjs
- **Upload** : Multer
- **WebSocket** : ws
- **Stockage** : Fichiers JSON + système de fichiers

## 🛠️ Technologies utilisées

### Frontend
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^7.0.0",
  "typescript": "^5.0.0",
  "vite": "^5.0.0",
  "sass": "^1.69.0",
  "jszip": "^3.10.0"
}
```

### Backend
```json
{
  "express": "^4.18.0",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "multer": "^1.4.5",
  "ws": "^8.14.0",
  "uuid": "^9.0.0",
  "cors": "^2.8.5"
}
```

## 📁 Structure du code

### Frontend (`src/`)

```
src/
├── components/          # Composants réutilisables
│   ├── Layout/         # Layout principal
│   ├── Notifications/  # Système de notifications
│   ├── PermissionManager/ # Gestion des permissions
│   └── ...
├── pages/              # Pages de l'application
│   ├── Files/          # Gestion des fichiers
│   ├── Dashboard/      # Tableau de bord
│   ├── Admin/          # Administration
│   └── ...
├── services/           # Services métier
│   ├── api.ts          # Client API centralisé
│   ├── websocket.ts    # Gestion WebSocket
│   ├── folderSync.ts   # Synchronisation dossier local
│   └── ...
├── context/            # Contextes React
│   └── AuthContext.tsx # Contexte d'authentification
├── types/              # Types TypeScript
│   └── index.ts        # Définitions de types
└── utils/              # Utilitaires
    └── officeFileGenerator.ts # Génération fichiers Office
```

### Backend (`server/`)

```
server/
├── routes/             # Routes API
│   ├── auth.js         # Authentification
│   ├── users.js        # Gestion utilisateurs
│   ├── files.js        # Gestion fichiers
│   ├── activity.js     # Logs d'activité
│   └── ...
├── utils/              # Utilitaires
│   ├── auth.js         # JWT, hachage
│   ├── storage.js      # Persistence JSON
│   ├── activityLogger.js # Logging automatique
│   ├── enrichUser.js   # Enrichissement req.user
│   └── broadcast.js    # Broadcast WebSocket
├── data/               # Données persistées
│   ├── users.json
│   ├── files.json
│   ├── activity.json
│   └── uploads/        # Fichiers physiques
├── scripts/            # Scripts utilitaires
│   └── create-admin-accounts.js
└── server.js           # Point d'entrée
```

## ⚙️ Configuration de l'environnement

### Variables d'environnement

**Frontend** (`.env` ou `.env.local`) :
```env
VITE_API_URL=http://localhost:3001/api
```

**Backend** (`.env` dans `server/`) :
```env
JWT_SECRET=demo-secret-key-change-in-production
PORT=3001
```

### Configuration Vite

Le frontend est configuré dans `vite.config.ts` :
- Proxy pour l'API en développement
- Support TypeScript
- Support SCSS

### Configuration Express

Le backend est configuré dans `server/server.js` :
- CORS activé pour le développement
- Parsing JSON
- Servir les fichiers statiques depuis `uploads/`

## 📝 Conventions de code

### TypeScript/JavaScript

- **Fichiers TypeScript** : `.ts`, `.tsx` pour les composants React
- **Fichiers JavaScript** : `.js`, `.jsx` pour les composants React
- **Nommage** : camelCase pour variables/fonctions, PascalCase pour composants
- **Imports** : Imports absolus depuis `src/` quand possible

### React

- **Composants fonctionnels** : Utiliser des hooks
- **Hooks personnalisés** : Préfixer avec `use`
- **Props** : Définir les types avec TypeScript
- **State** : Utiliser `useState` ou Context API

### Backend

- **Routes** : Organisées par ressource dans `routes/`
- **Middlewares** : `authenticate`, `isAdmin`, `enrichUser`
- **Erreurs** : Toujours retourner des erreurs JSON structurées
- **Logs** : Utiliser `activityLogger` pour les actions importantes

## 🔌 API Backend

### Structure d'une route

```javascript
import express from 'express';
import { authenticate, isAdmin } from '../utils/auth.js';
import { enrichUser } from '../utils/enrichUser.js';
import { readJSON, writeJSON } from '../utils/storage.js';
import { createActivityLog } from '../utils/activityLogger.js';
import { broadcast } from '../utils/broadcast.js';

const router = express.Router();
router.use(authenticate);
router.use(enrichUser);

// Route GET
router.get('/', (req, res) => {
  try {
    const data = readJSON('data.json') || [];
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route POST avec activité
router.post('/', (req, res) => {
  try {
    const data = readJSON('data.json') || [];
    const newItem = { id: uuidv4(), ...req.body };
    data.push(newItem);
    writeJSON('data.json', data);
    
    createActivityLog(req, 'item_created', `a créé un élément`, {
      itemId: newItem.id
    });
    
    broadcast({
      type: 'item_created',
      item: newItem,
      userId: req.user.id,
    });
    
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

### Middlewares disponibles

- **`authenticate`** : Vérifie le token JWT
- **`isAdmin`** : Vérifie que l'utilisateur est admin
- **`enrichUser`** : Ajoute `nom`, `prenom`, `email` à `req.user`

## 🎨 Services Frontend

### Service API (`src/services/api.ts`)

Service centralisé pour tous les appels API :

```typescript
import api from './services/api';

// Exemple d'utilisation
const files = await api.getFiles();
const newFile = await api.uploadFile(file, parentId);
await api.updateFileMetadata(fileId, { estFavori: true });
```

### Service WebSocket (`src/services/websocket.ts`)

Gestion de la connexion WebSocket :

```typescript
import { connectWebSocket, onWebSocketEvent } from './services/websocket';

// Écouter un événement
onWebSocketEvent('file_created', (data) => {
  console.log('Fichier créé:', data);
  // Mettre à jour l'UI
});
```

### Service de synchronisation (`src/services/folderSync.ts`)

Synchronisation avec dossier local :

```typescript
import { selectMainFolder, syncBidirectional } from './services/folderSync';

// Sélectionner un dossier
const result = await selectMainFolder();

// Synchroniser
await syncBidirectional((progress) => {
  console.log(`Progression: ${progress.current}/${progress.total}`);
});
```

## 🔄 WebSocket

### Événements émis par le backend

- `file_created`, `file_updated`, `file_deleted`, `file_renamed`, `file_moved`
- `folder_created`, `folder_deleted`
- `notification_created`, `notification_updated`, `notification_deleted`
- `calendar_event_created`, `calendar_event_updated`, `calendar_event_deleted`
- `note_created`, `note_updated`, `note_deleted`
- `task_created`, `task_updated`, `task_deleted`
- `board_created`, `board_updated`, `board_deleted`
- `card_created`, `card_updated`, `card_deleted`, `card_moved`
- `contact_created`, `contact_updated`, `contact_deleted`
- `user_created`, `user_blocked`, `user_unblocked`, `user_deleted`, `user_password_reset`, `user_role_changed`

### Utilisation dans un composant

```typescript
import { useEffect } from 'react';
import { onWebSocketEvent } from '../services/websocket';

const MyComponent = () => {
  useEffect(() => {
    const unsubscribe = onWebSocketEvent('file_created', (data) => {
      // Mettre à jour l'état
      setFiles(prev => [...prev, data.file]);
    });
    
    return () => unsubscribe();
  }, []);
};
```

## 🧪 Tests

### Tests manuels

1. **Tester l'authentification** :
   - Se connecter avec un compte admin
   - Vérifier que le token est stocké
   - Vérifier que les routes protégées fonctionnent

2. **Tester les fichiers** :
   - Upload un fichier
   - Vérifier qu'il apparaît dans la liste
   - Vérifier qu'il est sauvegardé dans `server/data/uploads/`

3. **Tester WebSocket** :
   - Ouvrir deux onglets
   - Créer un fichier dans un onglet
   - Vérifier qu'il apparaît dans l'autre onglet

### Tests automatisés (à implémenter)

```bash
# Tests frontend (à configurer)
npm run test

# Tests backend (à configurer)
cd server && npm run test
```

## 🐛 Débogage

### Frontend

**Console du navigateur** :
- Ouvrir les DevTools (F12)
- Vérifier les erreurs dans la console
- Vérifier les requêtes réseau dans l'onglet Network

**React DevTools** :
- Installer l'extension React DevTools
- Inspecter les composants et leur état

### Backend

**Logs serveur** :
- Les logs sont affichés dans la console
- Vérifier les erreurs lors des requêtes

**Fichiers de données** :
- Vérifier `server/data/*.json` pour voir les données
- Vérifier `server/data/uploads/` pour les fichiers

### Débogage WebSocket

```javascript
// Dans server/server.js, ajouter des logs
wss.on('connection', (ws) => {
  console.log('Client connecté');
  
  ws.on('message', (message) => {
    console.log('Message reçu:', message);
  });
});
```

## 📦 Build de production

### Frontend

```bash
npm run build
```

Le build est créé dans `dist/`.

### Backend

Le backend n'a pas besoin de build, il peut être exécuté directement :

```bash
cd server
npm start
```

## 🔧 Améliorations futures

### À implémenter

1. **Tests automatisés** :
   - Tests unitaires (Jest/Vitest)
   - Tests d'intégration
   - Tests E2E (Playwright/Cypress)

2. **Base de données** :
   - Migrer de JSON vers PostgreSQL/MySQL
   - Utiliser un ORM (Prisma/Sequelize)

3. **Cache** :
   - Redis pour le cache
   - Cache des fichiers fréquemment accédés

4. **Monitoring** :
   - Logs structurés (Winston)
   - Métriques (Prometheus)
   - Alertes

5. **Sécurité** :
   - Rate limiting
   - Validation plus stricte
   - Audit logs

## 📚 Ressources

- [Documentation React](https://react.dev)
- [Documentation Express](https://expressjs.com)
- [Documentation WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Documentation JWT](https://jwt.io)

## 🤝 Contribution

1. Créer une branche pour la fonctionnalité
2. Faire les modifications
3. Tester localement
4. Créer une pull request

## 📝 Notes importantes

- **Ne jamais commiter** les fichiers dans `server/data/` (sauf structure vide)
- **Ne jamais commiter** les tokens ou secrets
- **Toujours vérifier** les permissions avant les actions sensibles
- **Toujours logger** les actions importantes avec `activityLogger`

