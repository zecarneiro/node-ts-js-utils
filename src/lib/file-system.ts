import { ResponseBuilder } from './../entities/response';
import { Functions } from './functions';
import { EFileType } from './../enum/file-type';
import { Logger } from './logger';
import { ISystemInfo } from '../interface/system-info';
import { IFileInfo } from '../interface/file-info';
import { IBase64 } from '../interface/base64';
import * as fse from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as net from 'net';
import { Response } from '../entities/response';
import { TsJsUtilsApp } from '../ts-js-utils-app';
import { EPlatformType } from '..';
import { IDirectoryInfo } from '../interface/directory-info';
import { Uri, window, workspace, WorkspaceFolder } from 'vscode';

export class FileSystem extends TsJsUtilsApp {
  constructor() {
    super();
  }

  /* -------------------------------------------------------------------------- */
  /*                                   PRIVATE                                  */
  /* -------------------------------------------------------------------------- */
  private _systemInfo: ISystemInfo;

  /* -------------------------------------------------------------------------- */
  /*                                   PUBLIC                                   */
  /* -------------------------------------------------------------------------- */
  createTempFile(fileName: string): string {
    const temFile = FileSystem.resolvePath(`${this.systemInfo.tempDir}/${fileName}`);
    FileSystem.writeDocument(temFile, '');
    return temFile;
  }

  get systemInfo(): ISystemInfo {
    if (!this._systemInfo) {
      this._systemInfo = {
        tempDir: os.tmpdir(),
        homeDir: os.homedir(),
        platform: EPlatformType[os.platform()],
        hostname: os.hostname(),
        eol: os.EOL,
        userInfo: os.userInfo(),
        release: os.release(),
        type: os.type(),
        version: os.version(),
        uptime: os.uptime(),
        cpus: os.cpus(),
      };
    }
    return this._systemInfo;
  }

  get isWindows(): boolean {
    return this.systemInfo.platform === EPlatformType.win32;
  }

  get isLinux(): boolean {
    return this.systemInfo.platform === EPlatformType.linux;
  }

  get isOsx(): boolean {
    return this.systemInfo.platform === EPlatformType.darwin;
  }

  /* -------------------------------------------------------------------------- */
  /*                                   STATIC                                   */
  /* -------------------------------------------------------------------------- */
  static getFileInfo(file: string, validExt?: string[]): Response<IFileInfo> {
    const fileExt = path.extname(file);
    const isExt = (): boolean => {
      if (!validExt) {
        return true;
      }
      let isValid = false;
      if (validExt && validExt.length > 0) {
        for (const iterator of validExt) {
          if (iterator === fileExt || `.${iterator}` === fileExt) {
            isValid = true;
            break;
          }
        }
      }
      return isValid;
    };
    const response = new ResponseBuilder<IFileInfo>().withData({
      filename: file,
      basename: '',
      dirname: '',
      extension: fileExt,
      basenameWithoutExtension: '',
      isExtension: isExt,
    }).build();
    if (FileSystem.fileExist(file)) {
      response.data.basename = path.basename(file);
      response.data.dirname = path.dirname(file);
      response.data.basenameWithoutExtension = response.data.basename.replace(response.data.extension, '');
      if (!isExt()) {
        response.errorMsg = 'Invalid Extension: ' + validExt.toString;
      }
    } else {
      response.errorMsg = 'Invalid file: ' + file;
    }
    return response;
  }

  static getBase64File(file: string, type?: string): IBase64 {
    if (FileSystem.fileExist(file)) {
      const base = fse.readFileSync(file)?.toString('base64');
      return {
        base: base,
        url: `data:${type};base64,${base}`,
      };
    }
    return null;
  }

  static resolvePath(strPath: string): string {
    return Functions.isVscode ? FileSystem.getUriFileVs(strPath).fsPath : path.resolve(strPath);
  }

  static readJsonFile<T = any>(file: string): T {
    if (FileSystem.fileExist(file)) {
      try {
        return Functions.convert<T>(fse.readJsonSync(file, { encoding: 'utf8', flag: 'r' }));
      } catch (error) {
        const logger = new Logger();
        logger.error(error?.message);
      }
    }
    return null;
  }

  static readDocument(file: string): string {
    if (FileSystem.fileExist(file)) {
      const data = fse.readFileSync(file, { encoding: 'utf8', flag: 'r' });
      return data.toString();
    }
    return null;
  }

  static writeJsonFile(file: string, data: any, spaces?: string | number) {
    spaces = spaces ? spaces : 4;
    fse.writeJsonSync(file, data, { encoding: 'utf8', flag: 'w', spaces: spaces });
  }

  static writeDocument(file: string, data: any) {
    fse.writeFileSync(file, data, { encoding: 'utf8', flag: 'w' });
  }

  static moveFile(src: string, dest: string, overwrite: boolean) {
    if (FileSystem.fileExist(src)) {
      fse.moveSync(src, dest, { overwrite: overwrite });
    }
  }

  static fileType(file: string): EFileType {
    if (FileSystem.fileExist(file)) {
      if (fse.statSync(file).isDirectory()) return EFileType.directory;
      else if (fse.statSync(file).isFile()) return EFileType.file;
      else if (fse.statSync(file).isSymbolicLink()) return EFileType.symbolicLink;
    }
    return EFileType.none;
  }

  static fileExist(file: string): boolean {
    return fse.existsSync(file);
  }

  static createDir(dir: string) {
    if (!FileSystem.fileExist(dir)) {
      fse.mkdirSync(dir, { recursive: true });
    }
  }

  static copyDir(src: string, dest: string, overwrite: boolean) {
    if (FileSystem.fileExist(src)) {
      fse.copySync(src, dest, { recursive: true, overwrite: overwrite });
    }
  }

  static deleteFile(file: string, isDir?: boolean): boolean {
    if (FileSystem.fileExist(file)) {
      if (!isDir) fse.removeSync(file);
      else fse.rmdirSync(file);
      return FileSystem.fileExist(file) ? false : true;
    }
    return true;
  }

  static isValidIP(ip: string): boolean {
    if (net.isIPv4(ip)) {
      return true;
    }
    if (net.isIPv6(ip)) {
      return true;
    }
    return false;
  }

  static getCurrentDir(): string {
    return process.cwd();
  }

  static getScriptDir(): string {
    return __dirname;
  }

  static readDir(dir: string): string[] {
    let allFiles: string[] = [];
    if (FileSystem.fileExist(dir)) {
      allFiles = fse.readdirSync(dir);
    }
    return allFiles;
  }

  static readDirRecursive(dir: string, dirInfo?: IDirectoryInfo): IDirectoryInfo {
    dirInfo = dirInfo || {
      files: [],
      directories: [],
    };
    FileSystem.readDir(dir).forEach((file) => {
      const fileInfo = FileSystem.resolvePath(dir + '/' + file);
      if (FileSystem.fileType(fileInfo) === EFileType.directory) {
        dirInfo.directories.push(fileInfo);
        dirInfo = FileSystem.readDirRecursive(fileInfo, dirInfo);
      } else {
        dirInfo.files.push(path.join(dir, '/', file));
      }
    });
    return dirInfo;
  }

  static getUriFileVs(file: string): Uri {
    return Uri.file(file);
  }

  static getActiveTextEditorFileVs(): Response<IFileInfo> {
    return FileSystem.getFileInfo(window.activeTextEditor?.document.fileName);
  }

  static getWorkspaceDirVs(name?: string): WorkspaceFolder | WorkspaceFolder[] | undefined {
    const workspaceFolders = workspace.workspaceFolders;
    if (workspaceFolders) {
      const folders = Functions.copyJsonData<WorkspaceFolder[]>(workspaceFolders);
      if (name) {
        return folders.find((x: { name: string; }) => x.name === name);
      }
      return folders;
    }
    return undefined;
  }

  static getWorkspaceRootPathVs(): string {
    const dirs = FileSystem.getWorkspaceDirVs();
    if (dirs && dirs[0]) {
      return dirs[0].uri.fsPath;
    }
    return '';
  }
}
