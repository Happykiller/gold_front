/// <reference types="vite/client" />

// Variables d'environnement exposées au bundle. Elles sont injectées au build :
// tout ce qui est listé ici est PUBLIC et lisible dans le code livré — aucun
// secret ne doit y transiter.
interface ImportMetaEnv {
  readonly APP_MODE?: string;
  readonly APP_PORT?: string;
  readonly APP_DEBUG?: string;
  readonly API_URL?: string;
  /** Injectée par `define` dans vite.config.ts, depuis package.json. */
  readonly VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
