export default abstract class LoggerService {
  abstract log(...args: any[]): void;
  abstract debug(...args: any[]): void;
  abstract error(...args: any[]): void;
}