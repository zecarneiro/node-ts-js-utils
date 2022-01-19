import { Functions } from './global/functions';
import { ResponseBuilder } from '../entities/response';
import { EFileType } from '../enum/Efile-type';
import { ISystemInfo } from '../interface/Isystem-info';
import { IFileInfo } from '../interface/Ifile-info';
import { IBase64 } from '../interface/Ibase64';
import * as fse from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as net from 'net';
import { Response } from '../entities/response';
import { IDirectoryInfo } from '../interface/Idirectory-info';
import { EPlatformType } from '../enum/Eplatform-type';

export class FileSystem {
  constructor(
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                                   PRIVATE                                  */
  /* -------------------------------------------------------------------------- */
  private _systemInfo: ISystemInfo;

  /* -------------------------------------------------------------------------- */
  /*                                   PUBLIC                                   */
  /* -------------------------------------------------------------------------- */
  createTempFile(fileName: string): string {
    const temFile = this.resolvePath(`${this.systemInfo.tempDir}/${fileName}`);
    this.writeDocument(temFile, '');
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

  getFileInfo(file: string, validExt?: string[]): Response<IFileInfo> {
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
    if (this.fileExist(file)) {
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

  getBase64File(file: string, type?: string): IBase64 {
    if (this.fileExist(file)) {
      const base = fse.readFileSync(file)?.toString('base64');
      return {
        base: base,
        url: `data:${type};base64,${base}`,
      };
    }
    return null;
  }

  resolvePath(strPath: string): string {
    return path.resolve(strPath);
  }

  readJsonFile<T = any>(file: string): Response<T> {
    const response = new Response<T>();
    if (this.fileExist(file)) {
      try {
        response.data = Functions.convert<T>(fse.readJsonSync(file, { encoding: 'utf8', flag: 'r' }));
      } catch (error) {
        response.error = error;
      }
    }
    return response;
  }

  readDocument(file: string): string {
    if (this.fileExist(file)) {
      const data = fse.readFileSync(file, { encoding: 'utf8', flag: 'r' });
      return data.toString();
    }
    return null;
  }

  writeJsonFile(file: string, data: any, spaces?: string | number) {
    spaces = spaces ? spaces : 4;
    fse.writeJsonSync(file, data, { encoding: 'utf8', flag: 'w', spaces: spaces });
  }

  writeDocument(file: string, data: any) {
    fse.writeFileSync(file, data, { encoding: 'utf8', flag: 'w' });
  }

  moveFile(src: string, dest: string, overwrite: boolean) {
    if (this.fileExist(src)) {
      fse.moveSync(src, dest, { overwrite: overwrite });
    }
  }

  fileType(file: string): EFileType {
    if (this.fileExist(file)) {
      if (fse.statSync(file).isDirectory()) return EFileType.directory;
      else if (fse.statSync(file).isFile()) return EFileType.file;
      else if (fse.statSync(file).isSymbolicLink()) return EFileType.symbolicLink;
    }
    return EFileType.none;
  }

  fileExist(file: string): boolean {
    return fse.existsSync(file);
  }

  createDir(dir: string) {
    if (!this.fileExist(dir)) {
      fse.mkdirSync(dir, { recursive: true });
    }
  }

  copyDir(src: string, dest: string, overwrite: boolean) {
    if (this.fileExist(src)) {
      fse.copySync(src, dest, { recursive: true, overwrite: overwrite });
    }
  }

  deleteFile(file: string, isDir?: boolean): boolean {
    if (this.fileExist(file)) {
      if (!isDir) fse.removeSync(file);
      else fse.rmdirSync(file);
      return this.fileExist(file) ? false : true;
    }
    return true;
  }

  isValidIP(ip: string): boolean {
    if (net.isIPv4(ip)) {
      return true;
    }
    if (net.isIPv6(ip)) {
      return true;
    }
    return false;
  }

  getCurrentDir(): string {
    return process.cwd();
  }

  getScriptDir(): string {
    return __dirname;
  }

  readDir(dir: string): string[] {
    let allFiles: string[] = [];
    if (this.fileExist(dir)) {
      allFiles = fse.readdirSync(dir);
    }
    return allFiles;
  }

  readDirRecursive(dir: string, dirInfo?: IDirectoryInfo): IDirectoryInfo {
    dirInfo = dirInfo || {
      files: [],
      directories: [],
    };
    this.readDir(dir).forEach((file) => {
      const fileInfo = this.resolvePath(dir + '/' + file);
      if (this.fileType(fileInfo) === EFileType.directory) {
        dirInfo.directories.push(fileInfo);
        dirInfo = this.readDirRecursive(fileInfo, dirInfo);
      } else {
        dirInfo.files.push(path.join(dir, '/', file));
      }
    });
    return dirInfo;
  }
}
