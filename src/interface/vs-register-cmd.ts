import { ICallback } from './callback';
export interface IVsRegisterCmd {
    command: string;
    callback?: ICallback,
}
