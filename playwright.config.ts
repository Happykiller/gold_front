// Harnais de bout en bout : un navigateur réel devant le front de développement.
//
// Pourquoi, alors qu'il y a déjà Vitest : aucune des barrières existantes ne voit
// le rendu. jsdom ne calcule pas de géométrie, ne charge pas la vraie API et ne
// remonte pas les erreurs de console d'un écran monté pour de bon — un test au
// vert sur du CSS cassé ou sur un resolver renommé est la norme, pas l'exception
// (cf. CLAUDE.md, « Aucune ne voit le rendu », et ../CLAUDE.md sur le couplage
// front ↔ back sans typage). Playwright comble exactement ce trou : il ouvre les
// écrans, se connecte, et juge ce qui s'affiche.
//
//   npx playwright test                  # tous les écrans
//   npx playwright test --ui             # mode interactif
//   npx playwright show-report           # dernier rapport HTML
//
// Le chemin normal reste `bin/dev-e2e.sh` à la racine de l'orchestrateur : il
// vérifie d'abord que la stack répond.
import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

// Mêmes préfixes et mêmes fichiers que vite.config.ts : le harnais doit viser
// le front tel qu'il est réellement servi, pas une valeur recopiée à côté.
const env = loadEnv('development', process.cwd(), ['APP_', 'API_']);

const port = Number(env.APP_PORT) || 24083;
const baseURL = `http://localhost:${port}`;
const apiUrl = env.API_URL ?? '';

// Garde-fou de la loi 2, en dur. Sans `.env.local`, le `.env` du dépôt vise la
// PRODUCTION (`https://api.gold.happykiller.net/graphql`) : le harnais s'y
// connecterait avec de vrais identifiants et cliquerait dans les vraies données.
// Le coût d'un oubli étant sans commune mesure avec celui de ce test, on refuse
// de démarrer plutôt que d'avertir.
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(apiUrl)) {
  throw new Error(
    `refus : les tests e2e ne visent que l'environnement local, or API_URL=${apiUrl || '(vide)'}\n` +
      `        vérifier gold_front/.env.local (APP_MODE=dev, API_URL=http://localhost:24000/graphql).`,
  );
}

// Session partagée : la connexion se joue une fois (projet « connexion »), les
// écrans la réutilisent. Le jeton vit dans un cookie `gold-storage`
// (src/service/storage/storage.service.cookie.ts), que storageState capture.
export const FICHIER_SESSION = 'e2e/.auth/local.json';

export default defineConfig({
  testDir: './e2e',
  // Données bancaires réelles côté base de dev : on ne parallélise pas des
  // parcours qui regardent tous les mêmes comptes, et un échec doit être
  // reproductible tel quel.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    locale: 'fr-FR',
    // Le front est en français par défaut ; forcer la locale évite qu'un poste
    // en anglais fasse échouer les sélecteurs par libellé.
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'connexion',
      testMatch: /connexion\.setup\.ts/,
    },
    {
      name: 'ecrans',
      dependencies: ['connexion'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: FICHIER_SESSION,
      },
      testMatch: /.*\.spec\.ts/,
    },
  ],

  // Réutilise le serveur monté par `bin/dev-up.sh` ; ne le lance lui-même que
  // s'il n'y en a pas. `strictPort` côté Vite garantit qu'on ne juge pas l'écran
  // d'une instance précédente restée sur un autre port.
  webServer: {
    command: 'npm start',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
