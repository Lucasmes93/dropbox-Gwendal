# SPIREST MEDICAL - Cloud Storage Solution

Solution de stockage cloud sécurisée et synchronisée en temps réel pour SPIREST MEDICAL, similaire à Nextcloud mais adaptée aux besoins spécifiques de l'entreprise.

## 🚀 Fonctionnalités principales

### Gestion des fichiers
- ✅ Upload, téléchargement, création de fichiers et dossiers
- ✅ Création de fichiers Office (Word, Excel, PowerPoint) avec ouverture native
- ✅ Renommage, déplacement, suppression (corbeille)
- ✅ Recherche avancée
- ✅ Favoris et étiquettes
- ✅ Partage de fichiers (liens publics)
- ✅ Synchronisation bidirectionnelle avec dossier local
- ✅ Synchronisation automatique en temps réel via WebSocket

### Gestion des permissions
- ✅ Permissions granulaires (lecture, écriture, suppression, partage)
- ✅ Héritage des permissions depuis les dossiers parents
- ✅ Accès direct aux sous-dossiers sans accès au parent
- ✅ Gestion des permissions par les administrateurs

### Collaboration
- ✅ Édition collaborative en temps réel
- ✅ Verrouillage de fichiers pendant l'édition
- ✅ Historique des activités
- ✅ Notifications en temps réel

### Autres fonctionnalités
- ✅ Calendrier avec événements
- ✅ Notes
- ✅ Tâches
- ✅ Tableaux (Kanban)
- ✅ Contacts
- ✅ Galerie de photos
- ✅ Chat (en développement)

## 📋 Prérequis

- **Node.js** : version 18 ou supérieure
- **npm** : version 9 ou supérieure
- **Navigateur** : Chrome, Edge ou Opera (pour la synchronisation avec dossier local)

## 🔧 Installation

### Installation complète (frontend + backend)

```bash
# Installer toutes les dépendances
npm run install:all
```

### Installation séparée

**Frontend :**
```bash
npm install
```

**Backend :**
```bash
cd server
npm install
```

## 🚀 Démarrage

### Démarrage complet (frontend + backend)

```bash
npm run dev:full
```

Cette commande lance simultanément :
- Le serveur backend sur `http://localhost:3001`
- Le serveur frontend sur `http://localhost:5173`

### Démarrage séparé

**Backend uniquement :**
```bash
npm run dev:backend
# ou
cd server
npm run dev
```

**Frontend uniquement :**
```bash
npm run dev
```

## 👤 Comptes administrateurs par défaut

Le système est initialisé avec 3 comptes administrateurs par défaut :

| Email | Mot de passe | Nom | Prénom |
|-------|--------------|-----|--------|
| `admin1@spirest.fr` | `Admin123!` | Dupont | Jean |
| `admin2@spirest.fr` | `Admin123!` | Martin | Marie |
| `admin3@spirest.fr` | `Admin123!` | Bernard | Pierre |

**⚠️ Important :**
- Ces comptes sont créés automatiquement au premier démarrage du serveur
- Changez les mots de passe après la première connexion
- En production, modifiez ces comptes ou supprimez-les selon vos besoins

### Créer manuellement les comptes admin

Si les comptes admin ne sont pas créés automatiquement :

```bash
cd server
npm run create-admins
```

## 📁 Structure du projet

```
dropbox-Gwendal/
├── src/                    # Code source frontend (React/TypeScript)
│   ├── components/         # Composants React réutilisables
│   ├── pages/             # Pages de l'application
│   ├── services/          # Services (API, WebSocket, etc.)
│   ├── context/           # Contextes React (Auth, etc.)
│   └── types/             # Définitions TypeScript
├── server/                # Backend (Node.js/Express)
│   ├── routes/            # Routes API
│   ├── utils/             # Utilitaires (auth, storage, etc.)
│   ├── data/              # Données persistées (JSON)
│   │   ├── users.json
│   │   ├── files.json
│   │   ├── activity.json
│   │   └── uploads/       # Fichiers uploadés
│   └── scripts/          # Scripts utilitaires
└── package.json          # Configuration npm
```

## 🔐 Authentification

- **JWT** : Les tokens JWT sont utilisés pour l'authentification
- **Hachage des mots de passe** : bcryptjs avec 10 rounds
- **Sessions** : Gérées via tokens stockés dans localStorage

## 💾 Stockage des données

### Backend
Toutes les données sont stockées dans `server/data/` :
- **JSON** : Métadonnées (utilisateurs, fichiers, activités, etc.)
- **Fichiers physiques** : Dans `server/data/uploads/`

### Frontend
- **localStorage** : Token JWT et données utilisateur en session uniquement
- **Synchronisation** : Toutes les données viennent du backend via API

## 🔄 Synchronisation

### Synchronisation en temps réel
- **WebSocket** : Toutes les modifications sont synchronisées en temps réel entre tous les clients connectés
- **Événements** : Création, modification, suppression de fichiers, notifications, etc.

### Synchronisation avec dossier local
- **API File System Access** : Synchronisation bidirectionnelle avec un dossier sur le disque dur
- **Sélection du dossier** : Choisir le dossier principal de l'entreprise
- **Sous-dossiers** : Option pour synchroniser uniquement un sous-dossier spécifique
- **Automatique** : Synchronisation périodique configurable (par défaut : 30 secondes)

## 🌐 API Backend

### Endpoints principaux

**Authentification :**
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/auth/verify` - Vérifier le token

**Utilisateurs :**
- `GET /api/users` - Liste des utilisateurs (admin)
- `POST /api/users` - Créer un utilisateur (admin)
- `PATCH /api/users/:id` - Modifier un utilisateur
- `POST /api/users/:id/reset-password` - Réinitialiser le mot de passe (admin)
- `DELETE /api/users/:id` - Supprimer un utilisateur (admin)

**Fichiers :**
- `GET /api/files` - Liste des fichiers
- `POST /api/files/upload` - Upload un fichier
- `POST /api/files/folder` - Créer un dossier
- `PATCH /api/files/:id` - Modifier les métadonnées
- `DELETE /api/files/:id` - Supprimer (corbeille)
- `DELETE /api/files/:id/permanent` - Supprimer définitivement

**Autres :**
- `GET /api/activity` - Logs d'activité
- `GET /api/notifications` - Notifications
- `GET /api/calendar` - Événements du calendrier
- `GET /api/notes` - Notes
- `GET /api/tasks` - Tâches
- `GET /api/boards` - Tableaux
- `GET /api/contacts` - Contacts

## 🛠️ Scripts disponibles

### Frontend
- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Build de production
- `npm run preview` - Prévisualiser le build de production

### Backend
- `npm run dev:backend` - Démarrer le serveur backend
- `cd server && npm run dev` - Démarrer le serveur backend (depuis server/)
- `cd server && npm run create-admins` - Créer les comptes admin

### Global
- `npm run dev:full` - Démarrer frontend + backend simultanément
- `npm run install:all` - Installer toutes les dépendances

## 🔒 Sécurité

- **Mots de passe** : Hachés avec bcryptjs
- **JWT** : Tokens signés avec secret (à changer en production)
- **CORS** : Configuré pour le développement local
- **Validation** : Validation des entrées côté serveur
- **Permissions** : Vérification des permissions sur chaque action

## 📝 Logs d'activité

Toutes les actions sont automatiquement enregistrées :
- Création, modification, suppression de fichiers
- Gestion des utilisateurs
- Modifications de permissions
- Etc.

Les logs sont stockés dans `server/data/activity.json` et limités aux 1000 derniers.

## 🐛 Dépannage

### Le backend ne démarre pas
```bash
# Vérifier que les dépendances sont installées
cd server
npm install

# Vérifier que le port 3001 est libre
```

### Le frontend ne se connecte pas au backend
- Vérifier que le backend est démarré sur `http://localhost:3001`
- Vérifier la variable d'environnement `VITE_API_URL` si nécessaire

### Les fichiers ne s'uploadent pas
- Vérifier que le dossier `server/data/uploads/` existe
- Vérifier les permissions d'écriture

### Les comptes admin n'existent pas
```bash
cd server
npm run create-admins
```

## 📚 Documentation supplémentaire

- **[DEVELOPPEMENT.md](./DEVELOPPEMENT.md)** - Guide pour les développeurs
- **[FONCTIONNEMENT.md](./FONCTIONNEMENT.md)** - Guide de fonctionnement de l'application

## 🚧 Fonctionnalités en développement

- Chat complet avec backend
- Synchronisation de fichiers avec monitoring des changements
- Édition collaborative en temps réel pour fichiers Office
- Export/Import de données

## 📄 Licence

Propriétaire - SPIREST MEDICAL

## 👥 Support

Pour toute question ou problème, contactez l'équipe de développement.
