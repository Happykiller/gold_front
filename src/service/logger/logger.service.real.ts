import config from '@src/config';
import LoggerService from '@service/logger/logger.service';

export class LoggerServiceReal implements LoggerService {
  log(...args : any[]): void {
    console.log(args);
  }

  debug(...args : any[]): void {
    if (config.debug) {
      console.debug(args);
    }
  }

  error(...args : any[]): void {
    if (config.debug) {
      console.error(args);
    }
  }
} 