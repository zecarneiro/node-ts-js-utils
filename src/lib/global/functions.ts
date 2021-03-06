import { EFunctionsProcessType } from '../../enum/Efunctions-process-type';
import { Response, ResponseBuilder } from '../../entities/response';
import { IStringReplace } from '../../interface/Istring-replace';
import * as moment from 'moment';
import { IGenericObject } from '../../interface/Igeneric-object';

export class Functions {
  static get methodName(): Response<string> {
    const err = new Error();
    const errArr: string[] = err.stack ? err.stack?.split('\n') : [];
    const nameArr = /at \w+\.(\w+)/.exec(errArr.length >= 3 ? errArr[2] : '');
    return new ResponseBuilder<string>().withData(nameArr && nameArr.length >= 2 ? nameArr[1] : '').build(); // we want the 2nd method in the call stack
  }

  static get callerName(): Response<string> {
    const err = new Error();
    const errArr: string[] = err.stack ? err.stack?.split('\n') : [];
    const nameArr = /at \w+\.(\w+)/.exec(errArr.length >= 4 ? errArr[3] : '');
    return new ResponseBuilder<string>().withData(nameArr && nameArr.length >= 2 ? nameArr[1] : '').build(); // we want the 3nd method in the call stack
  }

  static get eolRegex(): RegExp {
    return /\r?\n/;
  }

  static async run<T>(caller: (...argsCaller: any[]) => any, args?: any[], thisArg?: any, isThrow?: boolean): Promise<Response<T>> {
    const result = new Response<T>();
    try {
      args = args ? args : [];
      result.data = await caller.apply(thisArg, args);
    } catch (error) {
      result.error = new Error(error);
      if (isThrow) {
        throw result.error;
      }
      result.data = Functions.convert<T>({});
    }
    return result;
  }

  static runSync<T>(caller: (...argsCaller: any[]) => any, args?: any[], thisArg?: any, isThrow?: boolean): Response<T> {
    const result = new Response<T>();
    try {
      args = args ? args : [];
      result.data = caller.apply(thisArg, args);
    } catch (error) {
      result.error = new Error(error);
      if (isThrow) {
        throw result.error;
      }
      result.data = this.convert<T>({});
    }
    return result;
  }

  static objectToString(data: any, space: number = 2, removeBreakLine?: boolean): string {
    let value: string;
    if (data instanceof Object) {
      value = space === 0 ? JSON.stringify(data) : JSON.stringify(data, null, space);
    } else {
      value = this.convert<string>(data);
    }
    if (value?.length > 0) {
      if (removeBreakLine) {
        return value.replace(/(\r\n|\n|\r)/gm, '');
      }
    }
    return value;
  }

  static isJsonParsable(jsonStr: string): boolean {
    try {
      JSON.parse(jsonStr);
    } catch (e) {
      return false;
    }
    return true;
  }

  static formatDate(dateVal?: Date, format?: string): string {
    dateVal = dateVal ? dateVal : new Date;
    format = format ? format : 'DD-MMM-YYYY HH:mm:ss';
    return (moment(dateVal)).format(format);
  }

  static getEnumValueName(value: any, typeEnum: any): string {
    if (value && typeEnum && typeEnum[value]) {
      return typeEnum[value] as string;
    }
    return '';
  }

  static stringToObject<T>(data: string): T {
    if (this.isJsonParsable(data)) {
      return JSON.parse(data) as T;
    }
    return {} as T;
  }

  static copyJsonData<T>(data: any): T {
    return this.stringToObject<T>(this.objectToString(data, 0));
  }

  static stringReplaceAll(data: string, keysToReplace?: IStringReplace[]): string {
    keysToReplace?.forEach((value) => {
      data = data.split(value.search).join(value.toReplace);
    });
    return data;
  }

  static toLowerUpperCase(value: string, isLower?: boolean): string {
    if (!value) {
      return value;
    }
    return isLower ? value.toLowerCase() : value.toUpperCase();
  }

  static createGenericType<T>(TCreator: new (...args: []) => T): T {
    return new TCreator();
  }

  static delay<T>(ms: number): Promise<T> {
    return new Promise<T>((resolve) => setTimeout(resolve, ms));
  }

  static getEnumData(data: any, isKeys?: boolean): any[] {
    if (isKeys) {
      return Object.keys(data);
    }
    return Object.values(data);
  }

  static getClassName(thisArg: any): string {
    return thisArg.constructor.name;
  }

  static removeLastCharacter(data: string, characters: string[]): string {
    const lastCharacter = data.substr(data.length - 1);
    if (characters.includes(lastCharacter)) {
      data = data.slice(0, data.length - 1);
    }
    return data;
  }

  static removeDuplicatesValues<T>(array: Array<T>): Array<T> {
    if (array instanceof Array) {
      const newArray: any[] = [];
      array.forEach((value) => {
        let exist = false;
        for (const key in newArray) {
          if (JSON.stringify(newArray[key]) === JSON.stringify(value)) {
            exist = true;
            break;
          }
        }
        if (!exist) {
          newArray.push(value);
        }
      });
      return newArray;
    }
    return array;
  }

  static removeElements<T>(array: Array<T>, element: T): Array<T> {
    const newArr: Array<T> = [];
    if (array instanceof Array) {
      array.forEach((val) => {
        if (val !== element) {
          newArr.push(val);
        }
      });
    }
    return newArr;
  }

  static isAsyncFunction(caller: any): boolean {
    const asyncFunction = (async () => {/* Generic is intentional */}).constructor;
    return caller instanceof asyncFunction;
  }

  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static sleepSync(ms: number) {
    const start = new Date().getTime();
    for (let i = 0; i < 1e7; i++) {
      const current = new Date().getTime();
      if ((current - start) > ms) {
        break;
      }
    }
  }

  static getErrorObjectData(error?: Error): any {
    let response;
    if (error) {
      try {
        throw error;
      } catch (err) {
        response = err;
      }
    }
    return response;
  }

  static convert<T>(value: any): T {
    return value as T;
  }

  static getMessageSeparator(callerName?: string): string {
    const dateVal = this.formatDate();
    return (callerName && callerName.length > 0) ?
      `\n------ ${callerName}: ${dateVal} ------\n` :
      `\n------ ${dateVal} ------\n`;
  }

  static getGlobalDataValue<T>(key: string): T {
    return Functions.getAllGlobalData().find((val) => val.key === key)?.value as T;
  }

  static setGlobalData(key: string, value: any) {
    const allData = Functions.getAllGlobalData();
    const index = allData.findIndex((val) => val.key === key);
    if (index > -1) {
      allData[index].value = value;
    } else {
      allData.push({ key: key, value: value });
    }
    global.nodeTsJsUtils = allData;
  }

  static getAllGlobalData(): IGenericObject<any>[] {
    let data: IGenericObject<any>[] = Functions.convert<IGenericObject<any>[]>(global.nodeTsJsUtils);
    if (!data) {
      data = [];
      global.nodeTsJsUtils = data;
    }
    return data;
  }

  static getTimestamp(date?: Date) {
    const dateNumber = date ? date.getTime() : new Date().getTime();
    return Math.floor(dateNumber / 1000);
  }

  static isTimePassed(loadTime: Date, checkTimeSeconds: number): boolean {
    const load = this.getTimestamp(loadTime);
    const currentTime = this.getTimestamp();
    return (currentTime - load) >= checkTimeSeconds;
  }

  static delDataFromArray<T>(data: T[], toRemove: T[]): T[] {
    for (let i = 0; i < data.length; i++) {
      if (toRemove.includes(data[i])) {
        data.splice(i, 1);
        i--;
      }
    }
    return data;
  }

  static delDataWithCondFromArray<T>(data: T[], condition: (val: T) => boolean): T[] {
    for (let i = 0; i < data.length; i++) {
      if (condition(data[i])) {
        data.splice(i, 1);
        i--;
      }
    }
    return data;
  }

  static float2int(value): number {
    return value | 0;
  }

  static getFilenameFromUrl(url: string): string {
    if (url) {
      const m = url.toString().match(/.*\/(.+?)\./);
      if (m && m.length > 1) {
        return m[1];
      }
    }
    return '';
  }

  static callbackProcess<T>(callback: (...args: any[]) => T, thisArg: any, type: EFunctionsProcessType, ...args: any): T {
    switch (type) {
      case EFunctionsProcessType.apply:
        return callback.apply(thisArg, ...args);
      case EFunctionsProcessType.call:
        return callback.call(thisArg, ...args);
      case EFunctionsProcessType.bind:
        return callback.bind(thisArg, ...args);
    }
  }

  static hasEol(value: string): boolean {
    if (value) {
      return Functions.eolRegex.test(value);
    }
    return false;
  }
}
