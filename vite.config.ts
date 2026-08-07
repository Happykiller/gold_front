import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

import { version } from './package.json';

export default defineConfig({
  plugins: [
    react(),
    // Les alias (@src, @presentation, @usecase, @service, @stores) sont lus
    // directement depuis tsconfig.json. Ils étaient jusqu'ici déclarés en double,
    // dans tsconfig.json ET dans webpack.config.js — une source de panne classique
    // quand on n'en mettait à jour qu'un seul.
    tsconfigPaths(),
  ],

  // Les assets statiques et les fichiers PWA restent où ils sont ; Vite les
  // recopie tels quels à la racine de dist/.
  publicDir: 'src/public',

  // Le projet nomme ses variables APP_* et API_URL depuis toujours, et le même
  // .env sert au docker-compose de développement. On conserve ces préfixes
  // plutôt que de tout renommer en VITE_*.
  envPrefix: ['APP_', 'API_'],

  define: {
    // Exposée dans l'interface via le module System de sunny-ui.
    'import.meta.env.VERSION': JSON.stringify(version),
  },

  server: {
    port: Number(process.env.APP_PORT ?? 8083),
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
});
