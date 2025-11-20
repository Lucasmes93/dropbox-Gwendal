# MonDrive - Interface Front-end

Application de gestion de fichiers type Dropbox/Google Drive avec une interface minimaliste.

## 🎨 Charte graphique

- **Fond** : Blanc
- **Texte** : Noir
- **Éléments secondaires** : Nuances de gris
- Design épuré sans couleurs vives, dégradés ou images décoratives

## 📋 Fonctionnalités

### Pages implémentées

1. **Connexion** (`/login`)
   - Authentification avec email et mot de passe
   - Validation côté front
   - Lien vers inscription et récupération de mot de passe

2. **Inscription** (`/register`)
   - Création de compte
   - Validation des champs (email, mots de passe identiques)
   - Acceptation des CGU obligatoire

3. **Mes fichiers** (`/files`)
   - Navigation dans les dossiers avec fil d'Ariane
   - Upload de fichiers (drag & drop)
   - Création de dossiers
   - Recherche de fichiers
   - Actions : télécharger, renommer, partager, supprimer
   - Vue tableau responsive

4. **Corbeille** (`/trash`)
   - Liste des fichiers supprimés
   - Restauration de fichiers
   - Suppression définitive
   - Option "Vider la corbeille"

5. **Profil** (`/profile`)
   - Modification des informations personnelles
   - Changement de mot de passe
   - Visualisation du stockage utilisé

6. **Partage public** (`/s/:token`)
   - Page publique de téléchargement
   - Accessible sans authentification
   - Gestion des liens expirés

### Composants

- **Layout** : Header avec navigation et menu utilisateur
- **Modales** :
  - Upload de fichiers avec progression
  - Création/renommage de dossiers
  - Partage de fichiers avec lien généré
- **ProtectedRoute** : Protection des routes authentifiées

## 🚀 Installation et démarrage

```bash
# Installation des dépendances
npm install

# Lancement en mode développement
npm run dev

# Build pour production
npm run build

# Prévisualisation du build
npm run preview
```

## 📱 Responsive

L'interface est optimisée pour :
- **Desktop** (≥ 1024px) : Vue complète avec tableau
- **Tablette** (≥ 768px) : Adaptation des colonnes
- **Mobile** (< 768px) : Menu hamburger, colonnes simplifiées

## 🔧 Technologies

- **React 19** avec TypeScript
- **Vite** pour le build
- **React Router** pour la navigation
- **CSS** pur (pas de framework UI)

## 📁 Structure du projet

```
src/
├── components/          # Composants réutilisables
│   ├── Layout.tsx
│   ├── ProtectedRoute.tsx
│   ├── UploadModal.tsx
│   ├── CreateFolderModal.tsx
│   ├── RenameModal.tsx
│   └── ShareModal.tsx
├── context/            # Contexte React
│   └── AuthContext.tsx
├── pages/              # Pages de l'application
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Files.tsx
│   ├── Trash.tsx
│   ├── Profile.tsx
│   ├── PublicShare.tsx
│   └── NotFound.tsx
├── styles/             # Fichiers CSS
│   ├── Layout.css
│   ├── Auth.css
│   ├── Files.css
│   ├── Modal.css
│   ├── Profile.css
│   ├── PublicShare.css
│   └── NotFound.css
├── types/              # Types TypeScript
│   └── index.ts
├── App.tsx             # Configuration du routing
├── main.tsx            # Point d'entrée
└── index.css           # Styles globaux
```

## 🔐 Authentification

L'authentification utilise actuellement des données mock pour la démonstration. Pour intégrer avec une vraie API :

1. Modifier `src/context/AuthContext.tsx`
2. Remplacer les appels simulés par des appels API réels
3. Gérer le stockage des tokens d'authentification

## 🌐 Intégration API

Les points d'intégration API à implémenter :

- **Auth** : `/api/login`, `/api/register`, `/api/logout`
- **Fichiers** : `/api/files`, `/api/files/:id`, `/api/upload`
- **Dossiers** : `/api/folders`, `/api/folders/:id`
- **Partage** : `/api/share`, `/api/share/:token`
- **Corbeille** : `/api/trash`, `/api/restore/:id`
- **Profil** : `/api/profile`, `/api/profile/password`

## 📝 Notes

- Les données actuelles sont des mocks pour la démonstration
- Tous les textes sont en français
- L'interface suit strictement la charte graphique minimaliste
- Le code est prêt pour l'intégration avec une API back-end

## 🎯 Prochaines étapes

Pour passer en production :
1. Intégrer l'API back-end
2. Ajouter la gestion des erreurs réseau
3. Implémenter le caching des données
4. Ajouter les tests unitaires et d'intégration
5. Optimiser les performances (lazy loading, etc.)
