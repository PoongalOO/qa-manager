# QA Manager

QA Manager est une application web Angular destinée au pilotage des activités de test logiciel. Elle permet d'organiser des projets QA, de structurer les cas de test par dossiers, de préparer des campagnes d'exécution et de suivre les résultats au fil de l'eau.

L'application est conçue comme un front-end Angular consommant une API REST exposée sous le préfixe `/api`. En développement, le proxy Angular redirige ces appels vers un back-end local disponible sur `http://localhost:8000`.

## Fonctionnalités principales

- **Authentification utilisateur**
  - Inscription et connexion.
  - Stockage local du jeton d'accès.
  - Protection des routes via guards Angular.

- **Gestion des rôles et permissions**
  - Rôles globaux : administrateur, utilisateur, QA manager.
  - Rôles par projet : manager, développeur, reporter.
  - Restrictions d'accès sur l'administration, les membres, les campagnes et les actions d'édition.

- **Gestion des projets**
  - Liste des projets accessibles.
  - Création, modification et paramétrage des projets.
  - Tableau de bord projet avec statistiques.
  - Gestion des membres du projet.

- **Organisation des cas de test**
  - Classement des cas de test dans des dossiers.
  - Création et édition de cas de test.
  - Gestion des priorités, types, états et statuts d'automatisation.
  - Support des cas au format texte ou étapes détaillées.
  - Association de tags et de pièces jointes.
  - Protection contre la perte de modifications non enregistrées.

- **Campagnes d'exécution**
  - Création et suivi des runs de test.
  - Association de cas de test à une campagne.
  - Suivi des statuts : non testé, passé, échoué, à retester, ignoré.
  - Historique des résultats par utilisateur.
  - Commentaires et indicateurs d'avancement.

- **Administration et compte utilisateur**
  - Espace d'administration réservé aux administrateurs.
  - Page de compte et paramètres utilisateur.
  - Gestion de la langue de l'interface.

- **Internationalisation**
  - Ressources de traduction en français et en anglais via `@ngx-translate`.

## Stack technique

- Angular 19
- Angular Material / CDK
- RxJS
- TypeScript
- `@ngx-translate` pour l'internationalisation
- Karma / Jasmine pour les tests unitaires

## Structure du projet

```text
src/app/
├── core/
│   ├── guards/          # Guards d'authentification, d'administration et d'édition
│   ├── interceptors/    # Intercepteur HTTP d'authentification
│   ├── models/          # Modèles TypeScript métier
│   └── services/        # Services REST et état applicatif
├── features/
│   ├── account/         # Compte et paramètres utilisateur
│   ├── admin/           # Administration
│   ├── auth/            # Connexion et inscription
│   ├── folders/         # Dossiers et cas de test
│   ├── health/          # Vérification de disponibilité
│   ├── projects/        # Projets, membres, paramètres et tableau de bord
│   └── runs/            # Campagnes d'exécution
└── shared/
    └── components/      # Composants réutilisables
```

## Prérequis

- Node.js compatible avec Angular 19.
- npm.
- Une API QA Manager lancée localement sur `http://localhost:8000` pour utiliser l'application en développement.

## Installation

Installer les dépendances :

```bash
npm install
```

## Lancement en développement

Démarrer le serveur Angular :

```bash
npm start
```

Puis ouvrir :

```text
http://localhost:4200/
```

Les appels `/api` sont proxifiés vers `http://localhost:8000` via `proxy.conf.json`.

## Build

Construire l'application :

```bash
npm run build
```

Les artefacts sont générés dans le dossier `dist/`.

## Tests unitaires

Lancer les tests unitaires :

```bash
npm test
```

Les tests utilisent Karma et Jasmine.

## Configuration API

L'URL de l'API est définie dans les fichiers d'environnement :

```ts
apiUrl: '/api'
```

En développement, la cible réelle est configurée dans `proxy.conf.json` :

```json
{
  "/api": {
    "target": "http://localhost:8000",
    "secure": false,
    "changeOrigin": true
  }
}
```

## Routes principales

- `/auth/signin` : connexion.
- `/auth/signup` : inscription.
- `/account` : compte utilisateur.
- `/account/settings` : paramètres utilisateur.
- `/projects` : liste des projets.
- `/projects/:projectId/home` : tableau de bord projet.
- `/projects/:projectId/folders` : dossiers et cas de test.
- `/projects/:projectId/runs` : campagnes d'exécution.
- `/projects/:projectId/members` : membres du projet.
- `/projects/:projectId/settings` : paramètres du projet.
- `/admin` : administration.
- `/health` : vérification de santé.

## Notes de développement

- Les composants de pages sont chargés en lazy loading via le routeur Angular.
- Les accès sont centralisés dans `AuthService` et les guards du dossier `core/guards`.
- Les données métier sont typées dans `core/models`.
- Les traductions sont stockées dans `src/assets/i18n/fr.json` et `src/assets/i18n/en.json`.
