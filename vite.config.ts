import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

import { version } from './package.json' with { type: 'json' };

// Les préfixes servent deux fois : ici pour lire .env / .env.local dans la
// config elle-même, et plus bas via `envPrefix` pour injecter les variables
// dans le bundle.
const ENV_PREFIX = ['APP_', 'API_'];

// Port du serveur de développement. Plage 24xxx réservée au projet — voir
// l'en-tête de ../docker-compose.dev.yml.
const DEFAULT_PORT = 24083;

export default defineConfig(({ mode }) => {
  // `process.env` ne contient PAS les variables des fichiers .env : Vite les
  // charge pour le bundle, pas pour le processus. Lire `process.env.APP_PORT`
  // renvoyait donc toujours `undefined`, et le port du serveur de dev venait
  // en réalité du défaut codé ici — le `APP_PORT` de .env.local n'avait aucun
  // effet, alors que tout le laissait croire. `loadEnv` corrige ça.
  const env = loadEnv(mode, process.cwd(), ENV_PREFIX);
  const port = Number(env.APP_PORT) || DEFAULT_PORT;

  return {
    plugins: [react()],

    resolve: {
      // Les alias (@src, @presentation, @usecase, @service, @stores) sont lus
      // directement depuis tsconfig.json. Ils étaient jusqu'ici déclarés en
      // double, dans tsconfig.json ET dans webpack.config.js — une source de
      // panne classique quand on n'en mettait à jour qu'un seul.
      // Support natif depuis Vite 8 : le plugin vite-tsconfig-paths n'est plus
      // nécessaire.
      tsconfigPaths: true,
    },

    // Les assets statiques et les fichiers PWA restent où ils sont ; Vite les
    // recopie tels quels à la racine de dist/.
    publicDir: 'src/public',

    // Le projet nomme ses variables APP_* et API_URL depuis toujours, et le même
    // .env sert au docker-compose de développement. On conserve ces préfixes
    // plutôt que de tout renommer en VITE_*.
    envPrefix: ENV_PREFIX,

    define: {
      // Exposée dans l'interface via le module System de sunny-ui.
      'import.meta.env.VERSION': JSON.stringify(version),
    },

    server: {
      port,
      // Échouer plutôt que déménager sur le port suivant : un serveur qui
      // glisse en silence de 24083 à 24084 fait valider l'écran servi par
      // l'instance précédente (voir docs/KB/REGLES/workflows.md).
      strictPort: true,
      // Pas d'équivalent de historyApiFallback à déclarer : en mode `spa`
      // (le défaut), Vite fait déjà retomber les routes de react-router
      // sur index.html.
    },

    build: {
      outDir: 'dist',
      // Pas de sourcemap dans le livrable : Webpack n'en produisait pas en
      // production, et les publier reviendrait à livrer le code source.
      sourcemap: false,
    },

    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/setupTests.ts'],
      // `e2e/` appartient à Playwright, pas à Vitest : sans cette exclusion,
      // `npm test` ramasse les `*.spec.ts` du harnais et échoue sur l'import de
      // `@playwright/test`, qui exige son propre lanceur.
      exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
      coverage: {
        provider: 'v8',
        // La couverture sert à voir ce qui n'est pas testé, pas à atteindre un
        // chiffre : aucun seuil bloquant n'est fixé.
        reporter: ['text-summary', 'html'],
        include: ['src/usecase/**', 'src/presentation/hooks/**'],
      },
    },
  };
});
