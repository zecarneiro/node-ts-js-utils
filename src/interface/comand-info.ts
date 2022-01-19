import { EShellType } from '../enum/shell-type';
export interface ICommandInfo {
    cmd: string,
    args?: string[],
    cwd?: string,
    shellType?: EShellType,
    encoding?: BufferEncoding,
    env?: NodeJS.ProcessEnv | { [key: string]: string | null },
    realTimeSuccessCode?: number,
    verbose?: boolean,
    isThrow?: boolean,
}
