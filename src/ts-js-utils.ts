import { ExtensionContext } from 'vscode';
import { IGenericObject } from './interface/generic-object';
import { Functions } from './lib/functions';
import { Java } from './lib/java';
import { Logger } from './lib/logger';
import { Console } from './lib/console';
import { Sqlite } from './lib/sqlite';
import { FileSystem } from './lib/file-system';
import { VsExtensionsManager } from './lib/vs-extensions-manager';
import { Windows } from './lib/windows';

export class TsJsUtils {
  constructor(
    private projectName: string,
    private contextVs?: ExtensionContext,
  ) {
    global.nodeVs = {
      projectName: this.projectName,
      logger: this.logger,
      contextVs: this.contextVs,
      others: Functions.convert<IGenericObject<any>>({}),
    };
  }

  private _console: Console | undefined;
  get console(): Console {
    if (!this._console) {
      this._console = new Console(this.fileSystem);
    }
    return this._console;
  }

  private _fileSystem: FileSystem | undefined;
  get fileSystem(): FileSystem {
    if (!this._fileSystem) {
      this._fileSystem = new FileSystem();
    }
    return this._fileSystem;
  }

  private _functions: Functions | undefined;
  get functions(): Functions {
      if (!this._functions) {
          this._functions = new Functions();
      }
      return this._functions;
  }

  private _java: Java | undefined;
  get java(): Java {
    if (!this._java) {
      this._java = new Java(this.console);
    }
    return this._java;
  }

  private _logger: Logger | undefined;
  get logger(): Logger {
    if (!this._logger) {
      this._logger = new Logger();
    }
    return this._logger;
  }

  private _sqlite: Sqlite | undefined;
  get sqlite(): Sqlite {
    if (!this._sqlite) {
      this._sqlite = new Sqlite(this.console, this.fileSystem);
    }
    return this._sqlite;
  }

  private _extensionManagerVs: VsExtensionsManager | undefined;
  get extensionManagerVs(): VsExtensionsManager {
    if (!this._extensionManagerVs) {
      this._extensionManagerVs = new VsExtensionsManager(this.console, this.sqlite, this.fileSystem);
    }
    return this._extensionManagerVs;
  }

  private _windows: Windows | undefined;
  get windows(): Windows {
    if (!this._windows) {
      this._windows = new Windows(this.console);
    }
    return this._windows;
  }
}
