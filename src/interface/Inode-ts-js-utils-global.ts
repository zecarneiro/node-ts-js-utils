import { FileSystem } from './../lib/global/file-system';
import { Functions } from './../lib/global/functions';
import { Logger } from './../lib/global/logger';
import { IGenericObject } from './Igeneric-object';
export interface INodeTsJsUtilsGlobal<T = any> {
    projectName: string,
    logger: Logger,
    functions: Functions,
    fileSystem: FileSystem,
    others: IGenericObject<T>[],
}
