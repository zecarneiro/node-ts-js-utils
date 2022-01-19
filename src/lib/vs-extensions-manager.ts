import { Console } from './console';
import { IVsStorageDb } from './../interface/vs-storage-db';
import { Response, ResponseBuilder } from './../entities/response';
import { IVsDisabledExtension } from './../interface/vs-disabled-extension';
import { Functions } from './functions';
import { FileSystem } from './file-system';
import { Sqlite } from './sqlite';
import { TsJsUtilsApp } from '../ts-js-utils-app';
import {
  Extension,
  extensions,
  workspace,
} from 'vscode';
import { IVsExtensionInfo } from '../interface/vs-extension-info';

export class VsExtensionsManager extends TsJsUtilsApp {
  readonly tableNameDbVs: string = 'ItemTable';
  readonly tableKeyDisabledExtensions: string = 'extensionsIdentifiers/disabled';
  readonly extensionsDisabledEnabledMsg = 'Extensions was disabled/enabled. Please Restart VSCode!!!';

  constructor(
    private console: Console,
    private sqlite: Sqlite,
    private fileSystem: FileSystem,
  ) {
    super();
  }

  /* -------------------------------------------------------------------------- */
  /*                                   PUBLIC                                   */
  /* -------------------------------------------------------------------------- */
  get dbFile(): string {
    let stateStorageFile: string = 'Code/User/globalStorage/state.vscdb';
    if (this.fileSystem.isLinux) {
      stateStorageFile = this.fileSystem.systemInfo.homeDir + '/.config/' + stateStorageFile;
    } else if (this.fileSystem.isWindows) {
      stateStorageFile = this.fileSystem.systemInfo.homeDir + '\\AppData\\Roaming\\' + stateStorageFile;
    } else {
      stateStorageFile = '';
    }
    return FileSystem.resolvePath(stateStorageFile);
  }

  get disabled(): IVsDisabledExtension[] {
    const checkTimeSec = this.refreshTime * 60; // Convert min to seconds
    if (!this.loadTime || Functions.isTimePassed(this.loadTime, checkTimeSec)) {
      this.refreshDisabledData();
      this.loadTime = new Date();
    }
    return Functions.copyJsonData<IVsDisabledExtension[]>(this._disabled);
  }

  /**
   * Refresh of 2 in 2 min by default
   * @param  {number} valMinutes
   */
  set refreshTime(valMinutes: number|undefined) {
    if (!valMinutes || valMinutes < this.minRefreshTime) {
      this._refreshTime = this.minRefreshTime;
    } else {
      this._refreshTime = valMinutes;
    }
  }
  get refreshTime(): number {
    return this._refreshTime < this.minRefreshTime ? this.minRefreshTime : this._refreshTime;
  }

  isDisabled(id: string): boolean {
    const upperId = Functions.toLowerUpperCase(id);
    return this.disabled.findIndex((val) => Functions.toLowerUpperCase(val.id) === upperId) !== -1;
  }

  getDisabledExtension(id: string): IVsDisabledExtension | undefined {
    for (const disabled of this.disabled) {
      if (disabled.id.toLowerCase() === id.toLowerCase()) {
        return disabled;
      }
    }
    return undefined;
  }

  private enableAll(): Response<boolean> {
    const response = new Response<boolean>();
    if (this.disabled.length > 0) {
      const query = `DELETE FROM ${this.tableNameDbVs} WHERE key = '${this.tableKeyDisabledExtensions}'`;
      const result = this.sqlite.exec(query, { file: this.dbFile });
      if (result.hasError) {
        response.error = result.error;
      }
    }
    response.data = true;
    return response;
  }

  disable(ids: string[]): Response<boolean> {
    if (!ids || ids.length <= 0) {
      return this.enableAll();
    }
    const toDisable: IVsDisabledExtension[] = [];
    ids.forEach((id) => {
      if (this.isDisabled(id)) {
        toDisable.push(this.getDisabledExtension(id));
      } else {
        const extensionInfo = VsExtensionsManager.getExtensionInfo(id);
        if (extensionInfo) {
          toDisable.push({ id: id, uuid: extensionInfo.uuid });
        }
      }
    });
    let response = new Response<boolean>();
    if (toDisable.length > 0) {
      const query = `INSERT OR REPLACE INTO ${this.tableNameDbVs} VALUES ("${this.tableKeyDisabledExtensions}", '${Functions.objectToString(toDisable, 0, true)}')`;
      const result = this.sqlite.exec<IVsStorageDb[]>(query, { file: this.dbFile });
      if (result.hasError) {
        response.error = response.error;
      } else {
        response.data = true;
      }
    } else {
      response = this.enableAll();
    }
    return response;
  }

  getPath(): string {
    return this.contextVs.extensionPath ? this.contextVs.extensionPath : '';
  }

  isInstalled(id: string): boolean {
    return this.isDisabled(id) || extensions.getExtension(id) ? true : false;
  }

  async installUninstallExtensions(ids: string[], isInstall: boolean) {
    const commandExt = isInstall ? 'code --install-extension {0}' : 'code --uninstall-extension {0}';
    ids = ids ? ids : [];
    for (const id of ids) {
      if ((isInstall && !this.isInstalled(id)) || (!isInstall && this.isInstalled(id))) {
        await this.console.exec({
          cmd: Functions.stringReplaceAll(commandExt, [{ search: '{0}', toReplace: id }]),
          isThrow: false,
        });
      }
    }
    const message = isInstall ? 'Install extensions' : 'Uninstall extensions';
    this.logger.emptyLine();
    this.logger.info(message + ', done. Please reload VSCode.');
  }

  /* -------------------------------------------------------------------------- */
  /*                                   STATIC                                   */
  /* -------------------------------------------------------------------------- */
  static getExtension<T>(extensionId: string): Extension<T> {
    return Functions.copyJsonData(extensions.getExtension<T>(extensionId));
  }

  static getExtensionInfo(extensionId: string): IVsExtensionInfo {
    let info = VsExtensionsManager.getExtension(extensionId) ?
      VsExtensionsManager.getExtension(extensionId).packageJSON :
      undefined;
    if (info) {
      info = Functions.convert<IVsExtensionInfo>(info);
      info.configData = info.name ? workspace.getConfiguration(info.name) : undefined;
    }
    return Functions.copyJsonData(info);
  }

  static getExtensionSettings<T = any>(extensionId: string, section?: string): T | undefined {
    const packageJson = VsExtensionsManager.getExtension(extensionId) ? VsExtensionsManager.getExtension(extensionId).packageJSON : undefined;
    if (packageJson['name'] && workspace.getConfiguration(packageJson['name'])) {
      return workspace.getConfiguration(packageJson['name']).get<T>(section ? section : '');
    }
    return undefined;
  }

  /* -------------------------------------------------------------------------- */
  /*                                   PRIVATE                                  */
  /* -------------------------------------------------------------------------- */
  private readonly minRefreshTime = 5;
  private _disabled: IVsDisabledExtension[] = [];
  private loadTime: Date|undefined;
  private _refreshTime: number = this.minRefreshTime; // in minutes

  private refreshDisabledData() {
    const query = `SELECT * FROM ${this.tableNameDbVs} WHERE key = '${this.tableKeyDisabledExtensions}'`;
    const result = this.sqlite.exec<IVsStorageDb[]>(query, { file: this.dbFile });
    if (result.hasError) {
      return new ResponseBuilder<IVsDisabledExtension[]>().withData(this._disabled).withError(result.error).build();
    }
    this._disabled = result.data && result.data.length > 0 ? Functions.stringToObject(result.data[0].value) : this._disabled;
  }
}
