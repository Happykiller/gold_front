# Gold Front

**Version :** 0.19.0  
**Auteur :** Fabrice Rosito <fabrice.rosito@gmail.com>  
**Licence :** MIT  

Gold Front est une interface utilisateur pour la gestion bancaire et budgétaire, conçue pour être performante, responsive et facile à utiliser.

---

## Table des matières

1. [Description](#description)
2. [Fonctionnalités](#fonctionnalités)
3. [Installation](#installation)
4. [Utilisation](#utilisation)
5. [Configuration](#configuration)
6. [Développement](#développement)
7. [Déploiement](#déploiement)
8. [Contributeurs](#contributeurs)
9. [Licence](#licence)

---

## Description

Gold Front est une application front-end développée avec **React** et **TypeScript**. Elle utilise les bibliothèques **MUI Material** pour une interface moderne et ergonomique, et **Webpack** pour la gestion des builds.

---

## Fonctionnalités

- **Gestion de budget** : Vue d'ensemble des comptes, débits, crédits et virements.
- **Responsive** : Consultation sur ordinateur et mobile.
- **Multilingue** : Basée sur `react-i18next` pour le support des langues.
- **Performances optimisées** : Divisions des chunks, cache efficace.
- **Modularité** : Architecture basée sur des alias pour une meilleure organisation.

---

## Installation

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/votre-repo/gold_front.git
   cd gold_front
   ```

2. Installer les dépendances :
   ```bash
   npm install
   ```

3. Configurer les variables d'environnement :
   - Copier `.env.example` en `.env` et définir les variables nécessaires.

---

## Utilisation

- Lancer le projet en mode développement :
  ```bash
  npm start
  ```

- Construire le projet pour la production :
  ```bash
  npm run build
  ```

- Accéder à l'application sur [http://localhost:8083](http://localhost:8083).

---

## Configuration

### Webpack
Le fichier `webpack.config.js` contient des configurations adaptées à différents environnements :
- **Mode développement** : Debugging facilité avec source maps.
- **Mode production** : Optimisation des bundles avec `MiniCssExtractPlugin`.

### TypeScript
Le fichier `tsconfig.json` est configuré avec :
- Des alias pour simplifier les imports.
- Support pour les dernières fonctionnalités de ES2021.

### Docker
Des fichiers Docker sont disponibles pour déployer rapidement l'application :
- `docker-compose.yml` : Déploiement en local.
- `docker-compose.prod.yml` : Déploiement en production.

Exemple de commande :
```bash
docker-compose -f docker-compose.yml up --build
```

---

## Développement

Les principales dépendances utilisées incluent :
- **React** et **React DOM** pour la base de l'application.
- **MUI Material** pour les composants visuels.
- **TypeScript** pour un typage fort et la résilience.
- **Zustand** pour la gestion de l'état.
- **Webpack** pour le bundling.

### Structure du projet
```
src/
├── presentation/  # Composants visuels
├── usecase/       # Cas d'utilisation métier
├── service/       # Appels API et logique métier
└── index.tsx      # Point d'entrée
```

---

## Déploiement

Pour déployer en production, utiliser le fichier `docker-compose.prod.yml` :
```bash
docker-compose -f docker-compose.prod.yml up --build
```

---

## Contributeurs

- **Fabrice Rosito** : Auteur principal.
- Contributions externes bienvenues via des **pull requests**.

---

## Licence

Ce projet est sous licence **MIT**. Voir le fichier `LICENSE` pour plus de détails.