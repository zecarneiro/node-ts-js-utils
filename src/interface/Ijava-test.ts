import { IFileInfo } from './Ifile-info';
import { ICommandInfo } from './Icomand-info';

export interface IJavaTest {
    file: IFileInfo,
    pomDir: string,
    isFailIfNoTests?: boolean,
    isClean?: boolean,
    method?: string,
    otherArgs?: string[],
    runCmdBeforeTest?: ICommandInfo[]
}
