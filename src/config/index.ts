// src\config\index.ts
class Config {
  mode: string;
  port: string;
  debug: boolean;
  api_url: string;
  local_storage_name: string;

  constructor() {
    this.mode = process.env.APP_MODE ?? 'dev';
    this.port = process.env.APP_PORT ?? '8080';
    this.api_url = process.env.API_URL ?? 'http://localhost:3000/graphql';
    this.debug = Boolean(process.env.APP_DEBUG) || false;
    this.local_storage_name = 'gold-storage';
  }
}

const config = new Config();

export default config;
