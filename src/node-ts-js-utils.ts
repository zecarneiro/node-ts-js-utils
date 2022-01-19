import { Java } from './lib/java';
import { Logger } from './lib/logger';
import { Console } from './lib/console/console';
import { Sqlite } from './lib/sqlite';
import { FileSystem } from './lib/file-system';

export class NodeTsJsUtils {
  constructor(
    protected projectName: string,
  ) {}

  protected _console: Console;
  get console(): Console {
    if (!this._console) {
      this._console = new Console(this.logger, this.fileSystem);
    }
    return this._console;
  }

  protected _fileSystem: FileSystem;
  get fileSystem(): FileSystem {
    if (!this._fileSystem) {
      this._fileSystem = new FileSystem();
    }
    return this._fileSystem;
  }

  private _java: Java;
  get java(): Java {
    if (!this._java) {
      this._java = new Java(this.console, this.fileSystem);
    }
    return this._java;
  }

  protected _logger: Logger;
  get logger(): Logger {
    if (!this._logger) {
      this._logger = new Logger();
    }
    return this._logger;
  }

  private _sqlite: Sqlite;
  get sqlite(): Sqlite {
    if (!this._sqlite) {
      this._sqlite = new Sqlite(this.projectName, this.console, this.fileSystem);
    }
    return this._sqlite;
  }
}
