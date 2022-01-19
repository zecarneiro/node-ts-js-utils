import { Functions } from './global/functions';
import { ELoggerType } from '../enum/Elogger-type';
import { EPrintType } from '../enum/Eprint-type';
import { chalk } from 'zx';
const readline = require('readline');
import * as os from 'os';

export class Logger {
  constructor() {}

  /* -------------------------------------------------------------------------- */
  /*                                  PROTECTED                                 */
  /* -------------------------------------------------------------------------- */
  protected _logger: any;
  protected get logger(): any {
    if (!this._logger) {
      this._logger = console;
    }
    return this._logger;
  }
  protected getLogger<T>(): T {
    return this.logger as T;
  }
  protected get prefix(): string {
    let data = this.className ? this.className : '';
    if (this.methodName) {
      data = data ? `${data} / ${this.methodName}` : data;
    }
    return !data ? '---' : data;
  }
  protected processPrefix(type: ELoggerType): string {
    let data = this.prefix + os.EOL;
      switch (type) {
        case ELoggerType.warn:
          data = chalk.yellow(`WARNING: ${data}`);
          break;
        case ELoggerType.error:
          data = chalk.red(`ERROR: ${data}`);
          break;
        case ELoggerType.info:
          data = chalk.blue(`INFO: ${data}`);
          break;
        case ELoggerType.success:
          data = chalk.green(`SUCCESS: ${data}`);
          break;
        case ELoggerType.table:
          data = chalk.bgMagenta(data);
          break;
        case ELoggerType.prompt:
          data = '$ ';
          break;
        case ELoggerType.log:
          data = '';
      }
      return data;
  }
  protected printData(type: ELoggerType, data: any, printType?: EPrintType) {
    if (data) {
      let eol = os.EOL;
      if (printType === EPrintType.sameLine) {
        eol = '';
      } else if (printType === EPrintType.carriageReturn) {
        eol = '';
        this.clearLine();
      }
      process.stdout.write(`${this.processPrefix(type)}${Functions.objectToString(data)}${eol}`);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                   PUBLIC                                   */
  /* -------------------------------------------------------------------------- */
  className: string = '';
  methodName: string = '';

  log(data: any, printType?: EPrintType) {
    this.printData(ELoggerType.log, data, printType);
  }

  warn(data: any, printType?: EPrintType) {
    this.printData(ELoggerType.warn, data, printType);
  }

  error(data: any, printType?: EPrintType) {
    this.printData(ELoggerType.error, data, printType);
  }

  info(data: any, printType?: EPrintType) {
    this.printData(ELoggerType.info, data, printType);
  }

  success(data: any, printType?: EPrintType) {
    this.printData(ELoggerType.success, data, printType);
  }

  prompt(data: string, printType?: EPrintType) {
    this.printData(ELoggerType.prompt, chalk.cyan(data), printType);
  }

  emptyLine(numLine: number = 1) {
    for (let i = 0; i < numLine; ++i) {
      this.getLogger<Console>().log('');
    }
  }

  title(data: string, printType?: EPrintType) {
    this.printData(ELoggerType.title, chalk.bold(chalk.gray(data)), printType);
  }

  clearScreen(ypos?: number) {
    if (!ypos) {
      ypos = 0;
    }
    readline.cursorTo(process.stdout, 0, ypos);
    readline.clearScreenDown(process.stdout);
  }

  clearLine() {
    this.clearScreen(0);
  }
}
