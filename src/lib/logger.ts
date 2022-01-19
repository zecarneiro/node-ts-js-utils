import { ENotifyType } from './../enum/notify-type';
import { FileSystem } from './file-system';
import { ELoggerType } from '../enum/logger-type';
import { Functions } from './functions';
import { EPrintType } from '../enum/print-type';
import { chalk } from 'zx';
import { OutputChannel, window } from 'vscode';
const readline = require('readline');

export class Logger {
  private fileSystem: FileSystem;
  private readonly outputChannelKey = 'outputChannel';
  private readonly minSpace = ' ';

  constructor() {
    this.fileSystem = new FileSystem();
  }

  /* -------------------------------------------------------------------------- */
  /*                                   PRIVATE                                  */
  /* -------------------------------------------------------------------------- */
  private _logger: any;
  private getLogger<T = Console | OutputChannel>(): T {
    if (!this._logger) {
      if (Functions.isVscode) {
        this._logger = Functions.getGlobalData<OutputChannel>(this.outputChannelKey, true);
        if (!this._logger) {
          this._logger = window.createOutputChannel(global.nodeVs.projectName);
          Functions.setGlobalData(this.outputChannelKey, this._logger);
        }
      } else {
        this._logger = console;
      }
    }
    return this._logger as T;
  }

  private get prefix(): string {
    let data = this.className ? this.className : '';
    if (this.methodName) {
      data = data ? `${data} / ${this.methodName}` : data;
    }
    return !data ? '---' : data;
  }

  private printData(type: ELoggerType, data: any, printType?: EPrintType) {
    if (data) {
      let finalData = this.prefix + this.fileSystem.systemInfo.eol;
      switch (type) {
        case ELoggerType.warn:
          finalData = chalk.yellow(`WARNING: ${finalData}`);
          break;
        case ELoggerType.error:
          finalData = chalk.red(`ERROR: ${finalData}`);
          break;
        case ELoggerType.info:
          finalData = chalk.blue(`INFO: ${finalData}`);
          break;
        case ELoggerType.success:
          finalData = chalk.green(`SUCCESS: ${finalData}`);
          break;
        case ELoggerType.table:
          finalData = chalk.bgMagenta(finalData);
          break;
        case ELoggerType.prompt:
          finalData = '$ ';
          break;
        case ELoggerType.log:
          finalData = '';
      }
      finalData = `${finalData}${Functions.objectToString(data)}`;
      if (!Functions.isVscode) {
        let eol = this.fileSystem.systemInfo.eol;
        if (printType === EPrintType.sameLine) {
          eol = '';
        } else if (printType === EPrintType.carriageReturn) {
          eol = '';
          this.clearLine();
        }
        process.stdout.write(`${finalData}${eol}`);
      } else {
        const logger = this.getLogger<OutputChannel>();
        logger.show(true);
        if (printType === EPrintType.sameLine) {
          logger.append(finalData);
        } else {
          if (printType === EPrintType.carriageReturn) {
            this.clearLine();
          }
          logger.appendLine(finalData);
        }
      }
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
      if (Functions.isVscode) {
        this.getLogger<OutputChannel>().appendLine('');
      } else {
        this.getLogger<Console>().log('');
      }
    }
  }

  title(data: string, printType?: EPrintType) {
    this.printData(ELoggerType.title, chalk.bold(chalk.gray(data)), printType);
  }

  clearScreen(ypos?: number) {
    if (Functions.isVscode) {
      this.getLogger<OutputChannel>().clear();
    } else {
      if (!ypos) {
        ypos = 0;
      }
      readline.cursorTo(process.stdout, 0, ypos);
      readline.clearScreenDown(process.stdout);
    }
  }

  clearLine() {
    if (Functions.isVscode) {
      this.clearScreen();
    } else {
      this.clearScreen(0);
    }
  }

  notifyVs(data: any, type?: ENotifyType) {
    const regex = /^\"|\"/g;
    data = !(data instanceof Object) ?
      data.replace(regex, '') :
      Functions.objectToString(data).replace(regex, '');
    data = `${this.prefix} - ${data}`;
    switch (type) {
      case ENotifyType.warning:
        window.showWarningMessage(data);
        break;
      case ENotifyType.error:
        window.showErrorMessage(data);
        break;
      default:
        window.showInformationMessage(data);
        break;
    }
  }
}
