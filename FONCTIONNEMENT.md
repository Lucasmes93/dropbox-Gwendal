# Guide de fonctionnement

Guide complet pour comprendre et utiliser l'application SPIREST MEDICAL Cloud Storage.

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Première connexion](#première-connexion)
3. [Gestion des fichiers](#gestion-des-fichiers)
4. [Gestion des permissions](#gestion-des-permissions)
5. [Synchronisation](#synchronisation)
6. [Fonctionnalités](#fonctionnalités)
7. [Administration](#administration)
8. [FAQ](#faq)

## 🎯 Vue d'ensemble

L'application SPIREST MEDICAL Cloud Storage est une solution complète de gestion de fichiers et de collaboration pour l'entreprise. Elle permet de :

- Stocker et organiser des fichiers de manière sécurisée
- Partager des fichiers avec des collègues
- Collaborer en temps réel
- Synchroniser avec un dossier local
- Gérer les permissions d'accès

## 🔐 Première connexion

### Comptes administrateurs par défaut

Lors du premier démarrage, 3 comptes administrateurs sont créés automatiquement :

| Email | Mot de passe | Nom | Prénom |
|-------|--------------|-----|--------|
| `admin1@spirest.fr` | `Admin123!` | Dupont | Jean |
| `admin2@spirest.fr` | `Admin123!` | Martin | Marie |
| `admin3@spirest.fr` | `Admin123!` | Bernard | Pierre |

**⚠️ Important** : Changez ces mots de passe après la première connexion !

### Se connecter

1. Ouvrir l'application dans le navigateur
2. Entrer l'email et le mot de passe
3. Cliquer sur "Se connecter"

### Créer un compte utilisateur

Les administrateurs peuvent créer de nouveaux comptes utilisateurs depuis la page **Administration**.

## 📁 Gestion des fichiers

### Upload de fichiers

1. Aller dans **Tous les fichiers**
2. Cliquer sur **"Téléverser"** ou utiliser le bouton **"+"**
3. Sélectionner les fichiers à uploader
4. Les fichiers apparaissent immédiatement dans la liste

### Créer un dossier

1. Cliquer sur **"+"** > **"Nouveau dossier"**
2. Entrer le nom du dossier
3. Le dossier est créé et apparaît dans la liste

### Créer un fichier Office

1. Cliquer sur **"+"** > **"Nouveau fichier"**
2. Choisir le type :
   - **Document Word** (.docx)
   - **Feuille Excel** (.xlsx)
   - **Présentation PowerPoint** (.pptx)
   - **Fichier texte** (.txt)
3. Le fichier est créé et s'ouvre automatiquement dans l'application native (Word, Excel, PowerPoint)

### Actions sur les fichiers

**Menu contextuel** (clic droit ou bouton "⋮") :
- **Télécharger** : Télécharger le fichier
- **Renommer** : Changer le nom
- **Déplacer** : Déplacer vers un autre dossier
- **Ajouter aux favoris** : Ajouter aux favoris
- **Ajouter une étiquette** : Ajouter des tags
- **Partager** : Créer un lien de partage
- **Supprimer** : Mettre à la corbeille

### Recherche

1. Utiliser la barre de recherche en haut
2. Les résultats s'affichent en temps réel
3. Filtrer par type, date, etc.

### Corbeille

- Les fichiers supprimés vont dans la **Corbeille**
- **Restaurer** : Remettre le fichier à sa place
- **Supprimer définitivement** : Supprimer pour toujours
- **Vider la corbeille** : Supprimer tous les fichiers de la corbeille

## 🔒 Gestion des permissions

### Permissions par défaut

Lors de la création d'un dossier :
- **Par défaut** : Partagé avec toute la boîte (lecture, écriture, suppression)
- **Héritage** : Les sous-dossiers et fichiers héritent des permissions du parent

### Modifier les permissions (Administrateur)

1. Aller dans **Administration** > **Gestion des permissions des dossiers**
2. Cliquer sur **"Gérer les permissions"** pour un dossier
3. Configurer :
   - **Permissions publiques** : Pour tous les utilisateurs
   - **Permissions par utilisateur** : Permissions spécifiques
   - **Hériter du parent** : Utiliser les permissions du dossier parent
   - **Appliquer aux enfants** : Appliquer ces permissions aux sous-dossiers

### Accès direct aux sous-dossiers

Si un utilisateur n'a pas accès au dossier parent mais a accès à un sous-dossier :
- Il peut accéder directement au sous-dossier
- Il ne voit pas les autres sous-dossiers du parent
- Les permissions du sous-dossier s'appliquent récursivement

**Exemple** :
- Dossier B : Non accessible à Jean
- Sous-dossier Bg1 : Accessible en lecture seule à Jean
- Résultat : Jean peut accéder à Bg1 et ses sous-dossiers, mais pas à B, Ba, Bb, etc.

## 🔄 Synchronisation

### Synchronisation en temps réel

L'application se synchronise automatiquement en temps réel :
- Les modifications apparaissent instantanément pour tous les utilisateurs connectés
- Pas besoin de rafraîchir la page
- Fonctionne via WebSocket

### Synchronisation avec dossier local

#### Configuration initiale

1. Aller dans **Paramètres** > **Synchronisation avec dossier local**
2. Cliquer sur **"Sélectionner le dossier principal"**
3. Choisir le dossier de l'entreprise (ex: `C:\Entreprise\Documents`)
4. (Optionnel) Choisir un sous-dossier spécifique à synchroniser
5. Cliquer sur **"Synchroniser maintenant"** pour la première synchronisation

#### Synchronisation automatique

1. Activer **"Activer la synchronisation automatique"**
2. Définir l'intervalle (par défaut : 30 secondes)
3. La synchronisation se fait automatiquement en arrière-plan

#### Comment ça fonctionne

**Synchronisation bidirectionnelle** :
- **Dossier local → Site** : Les fichiers du dossier local sont copiés vers le site
- **Site → Dossier local** : Les fichiers du site sont copiés vers le dossier local
- **Détection des modifications** : Seuls les fichiers modifiés sont synchronisés

**Première synchronisation** :
- Tous les fichiers existants sont synchronisés dans les deux sens
- La structure de dossiers est recréée automatiquement

## 🎨 Fonctionnalités

### Tableau de bord

Le tableau de bord affiche :
- **Stockage utilisé** : Espace utilisé sur le serveur
- **Fichiers récents** : Derniers fichiers modifiés
- **Activités récentes** : Dernières actions des utilisateurs
- **Notifications** : Notifications non lues
- **Événements à venir** : Prochains événements du calendrier
- **Tâches en cours** : Tâches à faire

### Calendrier

- **Créer un événement** : Cliquer sur une date
- **Modifier** : Double-cliquer sur un événement
- **Supprimer** : Clic droit > Supprimer

### Notes

- **Créer une note** : Bouton **"+"**
- **Éditer** : Cliquer sur une note
- **Supprimer** : Menu contextuel

### Tâches

- **Créer une tâche** : Bouton **"+"**
- **Modifier le statut** : Glisser-déposer ou menu
- **Assigner** : Assigner à un utilisateur

### Tableaux (Kanban)

- **Créer un tableau** : Bouton **"+"**
- **Créer une carte** : Double-cliquer dans une colonne
- **Déplacer une carte** : Glisser-déposer
- **Modifier** : Double-cliquer sur une carte

### Contacts

- **Ajouter un contact** : Bouton **"+"**
- **Modifier** : Cliquer sur un contact
- **Supprimer** : Menu contextuel

### Galerie

- Affiche automatiquement toutes les images uploadées
- Filtre par type d'image
- Vue en grille ou liste

## 👨‍💼 Administration

### Gestion des utilisateurs

**Créer un utilisateur** :
1. Aller dans **Administration**
2. Cliquer sur **"+ Créer un utilisateur"**
3. Remplir les informations
4. Choisir le rôle (Utilisateur ou Administrateur)

**Actions sur un utilisateur** :
- **Réinitialiser le mot de passe** : Génère un nouveau mot de passe temporaire
- **Bloquer/Débloquer** : Empêcher l'accès
- **Modifier le rôle** : Changer entre Utilisateur et Administrateur
- **Supprimer** : Supprimer définitivement l'utilisateur et toutes ses données

**⚠️ Attention** :
- La suppression d'un utilisateur supprime **TOUTES** ses données (fichiers, logs, etc.)
- Il doit rester au moins un administrateur dans le système

### Gestion des permissions

Voir section [Gestion des permissions](#gestion-des-permissions) ci-dessus.

### Profil utilisateur

**Modifier le profil** :
1. Cliquer sur votre nom en haut à droite
2. Aller dans **"Profil"**
3. Modifier :
   - Nom, prénom, email
   - Statut (En ligne, Absent, Occupé, Hors ligne)
4. Cliquer sur **"Mettre à jour"**

**Changer le mot de passe** :
1. Dans **Profil**
2. Entrer l'ancien mot de passe
3. Entrer le nouveau mot de passe (2 fois)
4. Cliquer sur **"Changer le mot de passe"**

## ❓ FAQ

### Comment partager un fichier avec un collègue ?

1. Clic droit sur le fichier > **"Partager"**
2. Copier le lien de partage
3. Envoyer le lien à votre collègue

### Comment synchroniser mes fichiers locaux avec le site ?

Voir section [Synchronisation avec dossier local](#synchronisation-avec-dossier-local).

### Je ne vois pas mes fichiers, que faire ?

1. Vérifier que vous êtes connecté
2. Vérifier les filtres (Recherche, Favoris, etc.)
3. Vérifier les permissions du dossier
4. Rafraîchir la page (F5)

### Comment restaurer un fichier supprimé ?

1. Aller dans **Corbeille**
2. Trouver le fichier
3. Cliquer sur **"Restaurer"**

### Comment créer un compte pour un nouvel employé ?

Seuls les administrateurs peuvent créer des comptes :
1. Se connecter en tant qu'administrateur
2. Aller dans **Administration**
3. Cliquer sur **"+ Créer un utilisateur"**
4. Remplir les informations et créer le compte

### Le fichier Office ne s'ouvre pas, que faire ?

- Vérifier que Microsoft Office est installé
- Vérifier que le navigateur est Chrome, Edge ou Opera
- Essayer de télécharger le fichier puis l'ouvrir manuellement

### La synchronisation ne fonctionne pas, que faire ?

1. Vérifier que le navigateur supporte l'API File System Access (Chrome, Edge, Opera)
2. Vérifier que le dossier est bien sélectionné
3. Vérifier que la synchronisation automatique est activée
4. Vérifier les permissions du dossier sur le disque

### Comment voir qui a modifié un fichier ?

1. Aller dans **Activités**
2. Filtrer par fichier ou utilisateur
3. Voir l'historique complet des actions

### Comment supprimer définitivement un fichier ?

1. Aller dans **Corbeille**
2. Trouver le fichier
3. Cliquer sur **"Supprimer définitivement"**

**⚠️ Attention** : Cette action est irréversible !

## 📞 Support

Pour toute question ou problème :
1. Vérifier cette documentation
2. Vérifier les logs d'activité
3. Contacter l'administrateur système
4. Contacter l'équipe de développement

## 🔄 Mises à jour

L'application se met à jour automatiquement en temps réel. Aucune action requise de votre part.

## 📝 Notes importantes

- **Sauvegarde automatique** : Toutes les modifications sont sauvegardées automatiquement
- **Synchronisation** : Les modifications sont synchronisées en temps réel
- **Permissions** : Respectez les permissions définies par les administrateurs
- **Sécurité** : Ne partagez jamais vos identifiants

