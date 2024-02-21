const path = __dirname+'/../../.env.local';

const dotenv = require('dotenv').config().parsed;
const dotenvlocal = require('dotenv').config({ path, override: true }).parsed;

exports.config = (config) => {
  const merged = Object.assign({}, config, dotenv, dotenvlocal);
  return {
    APP_MODE: merged?.APP_MODE??'dev',
    APP_PORT: merged?.APP_PORT??'80',
    APP_API_URL: merged?.APP_API_URL??'http://localhost:3000/graphql',
    APP_WS_URL: merged?.APP_WS_URL??'ws://localhost:3000/graphql',
    APP_API_TOKEN: merged?.APP_API_TOKEN??'token',
    APP_VESION: merged?.APP_VESION??'0.0.0',
    APP_DEBUG: merged?.APP_DEBUG??false,
  }
};