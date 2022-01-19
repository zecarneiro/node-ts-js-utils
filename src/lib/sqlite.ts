import { Console } from './console/console';
import { Response, ResponseBuilder } from './../entities/response';
import { ESqliteOutputFormat } from '../enum/Esqlite-output-format';
import { ISqliteOptions } from '../interface/Isqlite-options';
import * as os from 'os';
import { ProcessorUtils } from '../processor-utils';

export class Sqlite extends ProcessorUtils {
  private alreadyCheckExecFile = false;
  constructor(
    private console: Console,
  ) {
    super();
  }

  /* -------------------------------------------------------------------------- */
  /*                                   PRIVATE                                  */
  /* -------------------------------------------------------------------------- */
  private _command: string|undefined;

  private _fileSql: string;
  private get fileSql(): string {
    if (!this._fileSql) {
      const file = this.functions.stringReplaceAll(`${this.projectName}_sqlite_cmds`, [{ search: ' ', toReplace: '' }]);
      this._fileSql = this.fileSystem.resolvePath(`${this.fileSystem.systemInfo.tempDir}/${file}`);
    }
    return this._fileSql;
  }
  private set fileSql(val: string) {
    this._fileSql = val;
  }

  private writeCommands(commands: string, isDelete: boolean) {
    if (isDelete) {
      this.fileSystem.deleteFile(this.fileSql);
      this._fileSql = null;
    }
    this.fileSystem.writeDocument(this.fileSql, commands);
  }

  private getCommand(file: string, program: string): string {
    if (this.fileSystem.fileExist(file)) {
      if (this.fileSystem.isLinux) {
        return `"${program}" < "${file}"`;
      } else if (this.fileSystem.isWindows) {
        return `Get-Content "${file}" | ${program}`;
      }
    }
    return '';
  }

  /* -------------------------------------------------------------------------- */
  /*                                   PUBLIC                                   */
  /* -------------------------------------------------------------------------- */
  isValidToContinue(fileSql?: string): Response<boolean> {
    // Validate sqlite command
    if (!this.alreadyCheckExecFile) {
      const resultCmd = this.console.execSync({
        cmd: this.command,
        args: ['-version'],
      });
      this.alreadyCheckExecFile = true;
      if (resultCmd.hasError) {
        return new ResponseBuilder<boolean>().withError(new Error('Invalid sqlite command: ' + this.command)).build();
      }
    }

    // Validate database file
    if (fileSql && !this.fileSystem.fileExist(fileSql)) {
      return new ResponseBuilder<boolean>().withError(new Error('Invalid database file')).build();
    }
    return new ResponseBuilder<boolean>().withData(true).build();
  }

  get command(): string {
    if (!this._command || this._command.length == 0) {
      if (this.fileSystem.isWindows) {
        this._command = 'sqlite3.exe';
      } else if (this.fileSystem.isLinux) {
        this._command = 'sqlite3';
      } else if (this.fileSystem.isOsx) {
        this._command = 'sqlite3';
      } else {
        this._command = undefined;
      }
    }
    return this._command ? this._command : '';
  }
  set command(val: string) {
    this._command = val ? this.fileSystem.resolvePath(val) : undefined;
  }

  exec<T>(query: string, options: ISqliteOptions): Response<T> {
    const result = new Response<T>();
    options.file = options.file ? this.fileSystem.resolvePath(options.file) : '';
    options.encoding = options.encoding ? options.encoding : 'utf-8';
    options.outputFormat = options.outputFormat ? options.outputFormat : ESqliteOutputFormat.json;
    options.resultFile = options.resultFile && options.resultFile.length > 0 ? this.fileSystem.resolvePath(options.resultFile) : undefined;
    let commands: string = this.fileSystem.fileExist(options.file) ? `.open '${options.file}'${os.EOL}` : '';
    commands = options.resultFile ? `${commands}.output '${options.resultFile}'${os.EOL}` : commands;
    commands += `.mode ${options.outputFormat}${os.EOL}`;
    commands += query;
    commands += `;${os.EOL}.exit`;
    const isValid = this.isValidToContinue(options.file);
    if (isValid.hasError) {
      result.error = isValid.error;
      return result;
    }
    this.writeCommands(commands, false);
    const childProcess = this.console.execSync({
      cmd: this.getCommand(this.fileSql, this.command),
      encoding: options.encoding,
      verbose: false,
    });
    if (childProcess.hasError) {
      result.error = childProcess.error;
    }
    result.data = this.functions.stringToObject<T>(childProcess.data);
    return result;
  }
}
