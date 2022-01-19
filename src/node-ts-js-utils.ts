import { INodeTsJsUtilsGlobal } from './interface/Inode-ts-js-utils-global';
import { Functions } from './lib/global/functions';
import { Java } from './lib/java';
import { Logger } from './lib/global/logger';
import { Console } from './lib/console/console';
import { Sqlite } from './lib/sqlite';
import { FileSystem } from './lib/global/file-system';

export class NodeTsJsUtils {
  constructor(
    protected projectName: string,
  ) {
    global.nodeTsJsUtils = this.globalData;
  }

  protected get globalData(): INodeTsJsUtilsGlobal {
    return {
      projectName: this.projectName,
      fileSystem: new FileSystem(),
      functions: new Functions(),
      logger: new Logger(),
      others: [],
    };
  }

  protected _console: Console;
  get console(): Console {
    if (!this._console) {
      this._console = new Console();
    }
    return this._console;
  }

  private _java: Java;
  get java(): Java {
    if (!this._java) {
      this._java = new Java(this.console);
    }
    return this._java;
  }

  private _sqlite: Sqlite;
  get sqlite(): Sqlite {
    if (!this._sqlite) {
      this._sqlite = new Sqlite(this.console);
    }
    return this._sqlite;
  }
}
