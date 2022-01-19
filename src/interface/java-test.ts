import { IFileInfo } from './file-info';
import { ICommandInfo } from './comand-info';

export interface IJavaTest {
    file: IFileInfo,
    pomDir: string,
    isFailIfNoTests?: boolean,
    isClean?: boolean,
    method?: string,
    otherArgs?: string[],
    runCmdBeforeTest?: ICommandInfo[]
}
