import { EPlatformType } from './../enum/platform-type';
import * as os from 'os';

export interface ISystemInfo {
    tempDir: string,
    homeDir: string,
    platform: EPlatformType,
    hostname: string,
    eol: string,
    userInfo: os.UserInfo<string>,
    release: string,
    type: string,
    version: string,
    uptime: number,
    cpus: os.CpuInfo[],
}
