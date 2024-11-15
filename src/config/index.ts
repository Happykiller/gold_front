class Config {
  mode:string;
  port:string;
  debug:boolean;
  api_url:string;

  constructor(){
    this.mode = process.env.APP_MODE;
    this.port = process.env.APP_PORT;
    this.api_url = process.env.API_URL;
    this.debug = Boolean(process.env.APP_DEBUG) || false;
  }
}

const config = new Config();

export default config;