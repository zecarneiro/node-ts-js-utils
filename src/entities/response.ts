import { IErrorData } from './../interface/error-data';
import { Logger } from './../lib/logger';
import { FileSystem } from './../lib/file-system';
import { chalk } from 'zx';

export class Response<T> {
  private fileSystem: FileSystem;
  private logger: Logger;
  constructor() {
    this.logger = new Logger();
    this.fileSystem = new FileSystem();
  }
  private _data: T | any;
  get data(): T {
    return this._data;
  }
  set data(val: T) {
    this._data = val;
  }

  private _message: string | undefined;
  get message(): string | undefined {
    return this._message;
  }
  set message(val: string | undefined) {
    this._message = val;
  }

  private _status: number;
  get status(): number {
    return this._status;
  }
  set status(val: number) {
    this._status = val;
  }

  private errorData: IErrorData = {
    error: null,
    errorMsg: null,
  };
  get error(): Error {
    let data = this.errorData.error ? this.errorData.error.message : '';
    if (this.errorData.errorMsg) {
      data = data ? `${data}${this.fileSystem.systemInfo.eol}${this.errorData.errorMsg}` : this.errorData.errorMsg;
    }
    return new Error(data);
  }
  set error(val: Error|undefined) {
    this.errorData.error = val;
  }
  set errorMsg(val: string|undefined) {
    if (val && val.length > 0) {
      if (this.errorData.errorMsg) {
        this.errorData.errorMsg += `${this.fileSystem.systemInfo.eol}${val.trim()}`;
        // this.errorData.errorMsg += `${val.trim()}`;
      } else {
        this.errorData.errorMsg = val.trim();
      }
    }
  }
  get hasError(): boolean {
    return this.errorData.error || this.errorData.errorMsg ? true : false;
  }

  print() {
    if (this.data) {
      this.logger.log(this.data);
    }
    if (this.hasError) {
      this.logger.error(this.error.message);
    }
    if (this.status) {
      this.logger.log(`Status: ${this.status}`);
    }
  }

  static process<T>(response: Response<T>, setThrow: boolean = true): Response<T> {
    if (response.hasError && setThrow) {
      throw new Error(chalk.red(response.error?.message));
    }
    return response;
  }
}


export class ResponseBuilder<T> {
  private response: Response<T> = new Response();

  withData(val: T): ResponseBuilder<T> {
    this.response.data = val;
    return this;
  }

  withMessage(val: string): ResponseBuilder<T> {
    this.response.message = val;
    return this;
  }

  withError(val: Error | undefined): ResponseBuilder<T> {
    this.response.error = val;
    return this;
  }

  withErrorMsg(val: string|undefined): ResponseBuilder<T> {
    this.response.errorMsg = val;
    return this;
  }

  build(): Response<T> {
    return this.response;
  }
}
