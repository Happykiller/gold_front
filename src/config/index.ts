// src\config\index.ts
class Config {
  mode: string;
  port: string;
  debug: boolean;
  api_url: string;
  local_storage_name: string;

  constructor() {
    // Injectées au build par Vite depuis .env puis .env.local (cf. vite.config.ts,
    // envPrefix). Attention : `mode` ne vaut 'dev' ou 'prod' que si APP_MODE le
    // dit — toute autre valeur bascule l'application sur le service GraphQL
    // factice (cf. src/common/inversify.ts).
    this.mode = import.meta.env.APP_MODE ?? 'dev';
    this.port = import.meta.env.APP_PORT ?? '8080';
    this.api_url = import.meta.env.API_URL ?? 'http://localhost:24000/graphql';
    this.debug = Boolean(import.meta.env.APP_DEBUG) || false;
    this.local_storage_name = 'gold-storage';
  }
}

const config = new Config();

export default config;
