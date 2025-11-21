# MonDrive - Application de gestion de fichiers complète

Application web complète de gestion de fichiers type Nextcloud/Dropbox avec une interface minimaliste et des fonctionnalités avancées de collaboration et synchronisation.

## 🎨 Charte graphique

- **Fond** : Blanc
- **Texte** : Noir
- **Éléments secondaires** : Nuances de gris (bordures, fonds de cartes, hover, etc.)
- Design épuré sans couleurs vives, dégradés ou images décoratives obligatoires
- Interface responsive (desktop, tablette, mobile)

## 📋 Fonctionnalités principales

### 🔐 Authentification
- **Connexion** (`/login`) : Authentification avec email et mot de passe
- **Inscription** (`/register`) : Création de compte avec validation complète
- **Protection des routes** : Toutes les pages sont protégées sauf login/register
- **Gestion de session** : Persistance de la session utilisateur

### 📁 Gestion des fichiers
- **Upload de fichiers** : Drag & drop ou sélection de fichiers
- **Téléchargement** : Fichiers individuels et dossiers (en ZIP)
- **Création de dossiers** : Organisation hiérarchique
- **Navigation** : Fil d'Ariane (breadcrumbs) pour naviguer dans les dossiers
- **Recherche** : Recherche globale par nom de fichier
- **Actions sur fichiers** :
  - Renommer
  - Supprimer (corbeille)
  - Partager (génération de liens publics)
  - Télécharger
  - Ouvrir avec application système (Word, Excel, PowerPoint, Notepad)
- **Création de fichiers** :
  - Documents Word (.docx)
  - Feuilles Excel (.xlsx)
  - Présentations PowerPoint (.pptx)
  - Fichiers texte (.txt)

### 🔄 Synchronisation automatique
- **Synchronisation entre onglets** : Toutes les 2 secondes, synchronisation automatique des données entre les onglets du même navigateur
- **Synchronisation avec dossier local** : Synchronisation bidirectionnelle avec un dossier sur le disque dur
  - Sélection d'un dossier de synchronisation
  - Synchronisation manuelle ou automatique
  - Intervalle configurable (par défaut 30 secondes)
  - Compatible Chrome, Edge, Opera (API File System Access)

### ✏️ Édition collaborative
- **Édition en temps réel** : Édition collaborative des fichiers texte
- **Indicateurs de collaborateurs** : Affichage des utilisateurs en train d'éditer
- **Synchronisation instantanée** : Modifications visibles en temps réel entre collaborateurs

### 📄 Pages principales

#### Navigation fichiers
- **Tous les fichiers** (`/files`) : Gestion complète des fichiers et dossiers
- **Récents** (`/recent`) : Fichiers récemment modifiés
- **Favoris** (`/favorites`) : Fichiers marqués comme favoris
- **Partages** (`/shared`) : Fichiers que vous avez partagés
- **Partagé avec moi** (`/shared-with-me`) : Fichiers partagés par d'autres
- **Étiquettes** (`/tags`) : Organisation par tags
- **Corbeille** (`/trash`) : Fichiers supprimés avec restauration possible

#### Applications
- **Tableau de bord** (`/dashboard`) : Vue d'ensemble avec widgets (stockage, fichiers récents, événements, tâches, notifications, activité)
- **Calendrier** (`/calendar`) : Gestion d'événements avec création, modification, suppression
- **Contacts** (`/contacts`) : Carnet d'adresses
- **Notes** (`/notes`) : Prise de notes avec éditeur
- **Tâches** (`/tasks`) : Gestion de tâches avec statuts et priorités
- **Photos** (`/gallery`) : Galerie d'images
- **Tableaux** (`/boards`) : Tableaux Kanban pour la gestion de projet
- **Activité** (`/activity`) : Fil d'activité des actions récentes

#### Utilisateur
- **Profil** (`/profile`) : Modification des informations personnelles et mot de passe
- **Paramètres** (`/settings`) : Configuration de la synchronisation avec dossier local

#### Partage public
- **Lien public** (`/s/:token`) : Page publique de téléchargement accessible sans authentification

### 💬 Collaboration et communication
- **Chat/Messaging** : Système de messagerie interne
- **Notifications** : Système de notifications en temps réel
- **Statut utilisateur** : Affichage du statut (en ligne, absent, occupé, hors ligne)

## 🚀 Installation et démarrage

### Prérequis
- Node.js (version 18 ou supérieure)
- npm ou yarn

### Installation

```bash
# Cloner le projet (si applicable)
git clone <repository-url>
cd dropbox-Gwendal

# Installer les dépendances
npm install
```

### Démarrage

```bash
# Lancer en mode développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview
```

L'application sera accessible sur `http://localhost:5173` (ou le port configuré par Vite).

## 📁 Structure du projet

```
src/
├── components/              # Composants réutilisables
│   ├── BoardModal/         # Modal pour tableaux Kanban
│   ├── CalendarModal/      # Modal pour événements calendrier
│   ├── ChatPanel/          # Panneau de chat
│   ├── ContactModal/       # Modal pour contacts
│   ├── CreateFileMenu/     # Menu création de fichiers
│   ├── CreateFolderModal/  # Modal création dossier
│   ├── ErrorBoundary/      # Gestion des erreurs React
│   ├── FileActionMenu/     # Menu actions sur fichiers
│   ├── Layout/             # Layout principal
│   ├── Modal/              # Styles modaux de base
│   ├── NoteEditor/         # Éditeur de notes
│   ├── Notifications/      # Système de notifications
│   ├── ProtectedRoute/     # Protection des routes
│   ├── RenameModal/        # Modal renommage
│   ├── SearchBar/          # Barre de recherche globale
│   ├── ShareModal/         # Modal partage de fichiers
│   ├── Sidebar/            # Barre latérale de navigation
│   ├── TaskModal/          # Modal pour tâches
│   ├── UploadModal/        # Modal upload de fichiers
│   └── UserStatus/         # Statut utilisateur
├── context/                # Contexte React
│   └── AuthContext.tsx     # Contexte d'authentification
├── pages/                  # Pages de l'application
│   ├── Activity/           # Page activité
│   ├── Boards/             # Page tableaux Kanban
│   ├── Calendar/           # Page calendrier
│   ├── Contacts/           # Page contacts
│   ├── Dashboard/          # Page tableau de bord
│   ├── Favorites/          # Page favoris
│   ├── FileEditor/         # Éditeur de fichiers texte
│   ├── Files/              # Page principale fichiers
│   ├── Gallery/            # Page galerie photos
│   ├── Login/              # Page connexion
│   ├── Notes/              # Page notes
│   ├── NotFound/           # Page 404
│   ├── OfficeEditor/       # Éditeur Office (placeholder)
│   ├── Profile/            # Page profil
│   ├── PublicShare/        # Page partage public
│   ├── Recent/             # Page fichiers récents
│   ├── Register/           # Page inscription
│   ├── Search/             # Page recherche
│   ├── Settings/           # Page paramètres
│   ├── Shared/             # Page fichiers partagés
│   ├── SharedWithMe/       # Page fichiers partagés avec moi
│   ├── Tags/               # Page étiquettes
│   ├── Tasks/              # Page tâches
│   └── Trash/              # Page corbeille
├── services/               # Services
│   ├── folderSync.ts       # Synchronisation avec dossier local
│   ├── storage.ts          # Gestion localStorage
│   └── sync.ts             # Synchronisation automatique entre onglets
├── types/                  # Types TypeScript
│   └── index.ts            # Définitions de types
├── App.jsx                  # Configuration du routing
├── main.tsx                 # Point d'entrée
└── index.css                # Styles globaux
```

## 🔧 Technologies utilisées

- **React 19** : Bibliothèque UI
- **TypeScript** : Typage statique
- **Vite** : Build tool et serveur de développement
- **React Router DOM 7** : Routage client-side
- **SCSS/Sass** : Préprocesseur CSS
- **JSZip** : Création d'archives ZIP pour téléchargement de dossiers
- **File System Access API** : Accès au système de fichiers (Chrome, Edge, Opera)

## 📱 Responsive Design

L'interface est optimisée pour :
- **Desktop** (≥ 1024px) : Vue complète avec tableaux et toutes les fonctionnalités
- **Tablette** (≥ 768px) : Adaptation des colonnes et réorganisation des éléments
- **Mobile** (< 768px) : Menu hamburger, colonnes simplifiées, interface adaptée

## 🔄 Synchronisation

### Synchronisation automatique entre onglets
- Synchronisation toutes les 2 secondes
- Synchronisation de toutes les données (fichiers, calendrier, contacts, notes, tâches, etc.)
- Utilise `localStorage` et événements personnalisés
- Fonctionne entre tous les onglets du même navigateur

### Synchronisation avec dossier local
1. Aller dans **Paramètres** → **Synchronisation avec dossier local**
2. Cliquer sur **"Sélectionner un dossier"** et choisir le dossier de l'entreprise
3. Optionnel : Activer la **synchronisation automatique** avec intervalle configurable
4. Les fichiers du dossier local sont automatiquement importés dans l'application
5. Les modifications dans l'application sont synchronisées vers le dossier local

**Note** : Cette fonctionnalité nécessite Chrome, Edge ou Opera (API File System Access).

## 🎯 Utilisation

### Créer un compte
1. Aller sur `/register`
2. Remplir le formulaire (nom, prénom, email, mot de passe)
3. Accepter les CGU
4. Cliquer sur "Créer mon compte"

### Gérer ses fichiers
1. Aller sur `/files`
2. **Uploader** : Cliquer sur "Téléverser" ou glisser-déposer des fichiers
3. **Créer un dossier** : Cliquer sur "Nouveau dossier"
4. **Créer un fichier** : Cliquer sur le bouton "+" → choisir le type (Word, Excel, PowerPoint, Texte)
5. **Naviguer** : Cliquer sur un dossier pour l'ouvrir
6. **Actions** : Clic droit ou menu "..." pour renommer, supprimer, partager, télécharger

### Partager un fichier
1. Clic droit sur le fichier → **"Partager"**
2. Activer le lien de partage
3. Copier le lien généré
4. Le lien peut être partagé avec n'importe qui (même sans compte)

### Éditer un fichier texte en collaboration
1. Cliquer sur un fichier `.txt`
2. L'éditeur s'ouvre automatiquement
3. Les modifications sont sauvegardées automatiquement
4. Plusieurs utilisateurs peuvent éditer simultanément (dans le même navigateur)

### Ouvrir un fichier Office avec l'application système
1. Cliquer sur un fichier `.docx`, `.xlsx`, `.pptx`, ou `.txt`
2. Le fichier se télécharge et s'ouvre automatiquement avec l'application associée (Word, Excel, PowerPoint, Notepad)

## 🗄️ Stockage des données

L'application utilise `localStorage` pour stocker toutes les données :
- Fichiers et métadonnées
- Contenu des fichiers (base64)
- Liens de partage
- Événements calendrier
- Contacts
- Notes
- Tâches
- Tableaux Kanban
- Messages/Chat
- Notifications
- Activités

**Note** : Pour une utilisation en production, il faudra remplacer `localStorage` par des appels API vers un backend.

## 🔐 Sécurité

- Protection des routes avec `ProtectedRoute`
- Validation côté client des formulaires
- Gestion des erreurs avec `ErrorBoundary`
- Gestion globale des erreurs JavaScript

## 🐛 Gestion des erreurs

L'application inclut :
- **ErrorBoundary** : Capture les erreurs React et affiche un message avec option de rechargement
- **Gestion globale des erreurs** : Capture les erreurs JavaScript non gérées
- **Protection localStorage** : Gestion des erreurs de quota
- **Protection synchronisation** : Gestion des erreurs de synchronisation sans bloquer l'application

## 📝 Notes importantes

### Limitations actuelles
- **Stockage** : Utilise `localStorage` (limite ~5-10MB selon le navigateur)
- **Synchronisation dossier local** : Nécessite Chrome, Edge ou Opera
- **Édition collaborative** : Fonctionne uniquement dans le même navigateur (simulation)
- **Édition Office** : Placeholder pour intégration OnlyOffice/Collabora/Office Online

### Pour la production
- Remplacer `localStorage` par une API backend
- Implémenter WebSockets pour la collaboration en temps réel
- Intégrer OnlyOffice/Collabora/Office Online pour l'édition Office
- Ajouter l'authentification réelle (JWT, OAuth, etc.)
- Implémenter la synchronisation avec un serveur

## 🛠️ Scripts disponibles

```bash
# Développement
npm run dev

# Build production
npm run build

# Prévisualisation du build
npm run preview

# Linting
npm run lint
```

## 📦 Dépendances principales

- `react` : ^19.2.0
- `react-dom` : ^19.2.0
- `react-router-dom` : ^7.9.6
- `jszip` : ^3.10.1
- `sass` : ^1.94.2

## 🎉 Fonctionnalités complètes

✅ Authentification complète  
✅ Gestion complète des fichiers (CRUD)  
✅ Navigation dans les dossiers  
✅ Partage de fichiers avec liens publics  
✅ Synchronisation automatique entre onglets  
✅ Synchronisation avec dossier local  
✅ Édition collaborative en temps réel  
✅ Création de fichiers Office  
✅ Ouverture avec applications système  
✅ Calendrier avec événements  
✅ Contacts  
✅ Notes avec éditeur  
✅ Tâches avec priorités  
✅ Galerie photos  
✅ Tableaux Kanban  
✅ Fil d'activité  
✅ Notifications  
✅ Chat/Messaging  
✅ Recherche globale  
✅ Statut utilisateur  
✅ Interface responsive  

## 📄 Licence

Ce projet est un projet de démonstration.

## 👤 Auteur

Application développée pour la gestion de fichiers d'entreprise.

---

**Note** : Cette application est une démonstration complète avec toutes les fonctionnalités demandées. Pour une utilisation en production, il faudra intégrer un backend réel et adapter certaines fonctionnalités.
