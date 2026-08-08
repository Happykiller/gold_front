# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Interface de **Gold** (gestion bancaire et budgétaire) : React 19 + MUI 9 + Vite. L'API
GraphQL qu'elle consomme vit dans le dépôt voisin `gold_server` — voir `../CLAUDE.md` pour le
contrat entre les deux.

> `README.md` annonce la version 0.19.0 alors que `package.json` est en 1.7.0 : se fier au
> `package.json`.

# Base de connaissance

La mémoire longue du projet est dans [`../docs/KB/`](../docs/KB/README.md), versionnée par le
dépôt orchestrateur `gold/` : architecture technique ([`DAT/`](../docs/KB/DAT/README.md)),
fonctionnelle ([`DAF/`](../docs/KB/DAF/README.md)), règles
([`REGLES/`](../docs/KB/REGLES/README.md)), outillage ([`MOTEUR.md`](../docs/KB/MOTEUR.md)) et
historique ([`HISTORY.md`](../docs/KB/HISTORY.md)).

**Avant d'agir sur un sujet, consulte l'index concerné.** `REGLES/lois.md` et
`REGLES/consignes.md` priment sur tes défauts. En fin de session utile, lance `/capitalize`.

## Commandes

```bash
npm install
npm start          # vite → http://localhost:8083 (lire le port réellement annoncé)
npm run check      # lint + build + test : les trois barrières, dans l'ordre de la CI
npm run codegen    # régénère src/gql/graphql.ts depuis le schéma
npm run release:patch | release:minor | release:major
```

Quatre barrières, toutes en CI : `lint` (ESLint + Prettier), `codegen:check`, `test` (Vitest +
Testing Library, `*.test.ts(x)` à côté du code couvert) et `build` (`tsc --noEmit` puis
`vite build`). `npm run check` enchaîne les trois qu'on lance à la main.

**Aucune ne voit le rendu.** jsdom ne calcule pas de géométrie : un test de mise en page passe au
vert sur du CSS cassé. Le passage à l'œil, écran par écran, reste la seule barrière pour cette
classe de défaut — voir [`../docs/KB/DAT/interface-mui.md`](../docs/KB/DAT/interface-mui.md).

Docker : `make start` / `make startall` / `make down` (conteneur `gold_front`, 8083→80, nginx).

## Architecture — symétrique du back

```
presentation/  écrans, layouts, molecules, hooks, stores Zustand
     ↓
usecase/       une action métier = un dossier
     ↓
service/       graphql/ (fetch ou fake), storage/ (cookie)
```

Comme côté serveur, le câblage passe par un singleton DI manuel, `src/common/inversify.ts`
(aucun rapport avec InversifyJS) : il instancie les usecases du projet **et** ceux de
`@happykiller/sunny-ui` (auth, passkeys, session, system), puis choisit `GraphqlServiceFetch`
en `dev`/`prod` et `GraphqlServiceFake` sinon.

**Ajouter un usecase** : créer `src/usecase/<feature>/` avec `<feature>.usecase.ts`,
`.usecase.dto.ts` et `.usecase.model.ts`, puis déclarer la propriété et le `new` dans
`inversify.ts`.

### Convention de retour des usecases

Un usecase ne laisse **jamais** remonter d'exception. Il renvoie toujours :

```ts
{ message: CODES.SUCCESS, data }   // ou
{ message: CODES.FAIL, error }     // CODES : src/common/codes.ts
```

Les composants testent `message` avant de lire `data`. Modèle de référence :
`src/usecase/getAccounts/getAccounts.usecase.ts`.

### Requêtes GraphQL écrites à la main

Aucun client GraphQL, aucun codegen : chaque usecase contient sa requête en template string et
appelle `this.inversify.graphqlService.send({ operationName, variables, query })`. Un champ
ajouté côté serveur n'apparaît ici que si on l'ajoute explicitement à la requête — et une
rupture de contrat ne sera détectée qu'à l'exécution. Voir `../CLAUDE.md`.

## État — Zustand

- `src/presentation/store/contextStore.tsx` : session (`access_token`, identité) et
  `themeMode`. Persisté via `StorageServiceCookie` sous la clé `config.local_storage_name`
  (`gold-storage`) — `GraphqlServiceFetch` relit ce cookie pour poser l'en-tête
  `Authorization: Bearer`. Toucher à la forme de ce store ou à la clé de stockage déconnecte
  les sessions en cours.
- `src/presentation/store/passkeyStore.tsx` : flux WebAuthn.
- `src/stores/useCalculatorStore.ts` : calculatrice flottante.

## Routage et écrans

Toutes les routes sont déclarées dans `src/app.tsx`, chargées en `React.lazy`, et encadrées
soit par `LayoutPublicExt`, soit par `LayoutProtectedExt` — ce dernier délègue au
`LayoutProtected` de `sunny-ui` et porte la garde de session (`sessionInfo` usecase).

Les écrans sont des fichiers plats de `src/presentation/` (`home.tsx`, `operations.tsx`,
`ventilation.tsx`, `clone.tsx`, `createVir.tsx`, `operation_new.tsx`, `operation_edit.tsx`,
`graphic/`), les pages secondaires dans `routes/`, les briques réutilisables dans `molecule/`
(`operationsTable`, `accountTree`, `accountsSelect`, `thirdsSelect`, …) et la logique de
chargement partagée dans `hooks/` (`useAccounts`, `useAccountOperations`).

## i18n — obligatoire

Tout libellé passe par `react-i18next`. Ajouter la clé dans `src/locales/fr/translation.json`
**et** `src/locales/en/translation.json`. Certains libellés arrivent de la base sous forme de
clés (`operation.type-credit`, `account.type-regular`, `operation.status-reconciled`) issues du
seed SQL du serveur et résolues ici : ne pas les renommer d'un seul côté.

## Configuration et build

Vite (`vite.config.ts`). Deux points de vigilance :

- les **alias de chemins sont déclarés dans `tsconfig.json` seulement** : Vite les lit de là.
  La duplication qu'imposait Webpack a disparu (`@src`, `@presentation`, `@usecase`,
  `@service`, `@stores`, plus les doublons historiques `@components`, `@usecases`, `@services`) ;
- les variables d'environnement viennent de `.env` (copié de `.env.template`) puis
  `.env.local` (override, gitignoré), exposées au bundle par Vite et lues dans
  `src/config/index.ts` : `APP_MODE` (`dev` | `prod` | autre → service GraphQL factice),
  `APP_PORT`, `API_URL` (défaut `http://localhost:3000/graphql`).

## Conventions

TypeScript `strict`, 2 espaces, point-virgules. Composants React en PascalCase
(`LayoutProtectedExt.tsx`), hooks en camelCase (`useAccounts.ts`), usecases en
`feature.action.usecase.ts`. Préférer les alias aux imports relatifs longs.

UI : MUI 9 + Emotion, icônes `@mui/icons-material`, graphiques Highcharts, dates
`@mui/x-date-pickers` (dayjs). Assets statiques et fichiers PWA dans `src/public/` ; `dist/`
n'est jamais édité à la main.

**Un seul thème, sombre.** Les couleurs viennent de `src/theme/tokens.ts` et s'écrivent
**toujours dans `sx`** — la prop `color` de MUI n'accepte que des clés de palette et n'applique
rien, en silence, sur une valeur hexadécimale. Les écrans se composent avec les briques de
`src/presentation/molecule/` (`PageShell`, `FormSection`, `SubmitBar`, `AsyncState`,
`RefSelect`) plutôt qu'en réinventant leur cadre.

## Commits & PR

Messages courts et impératifs, préfixes Conventional Commits quand c'est pertinent
(`feat: add cashflow chart filters`). Une PR décrit les changements visibles par l'utilisateur,
joint une capture pour tout travail d'UI, et signale l'impact éventuel sur `.env`, sur le
contrat GraphQL ou sur Docker.
