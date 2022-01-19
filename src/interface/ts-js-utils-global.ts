import { ExtensionContext } from 'vscode';
import { Logger } from './../lib/logger';
import { IGenericObject } from './generic-object';
export interface TsJsUtilsGlobal<T = any> {
    projectName: string,
    logger: Logger,
    contextVs: ExtensionContext,
    others: IGenericObject<T>,
}
