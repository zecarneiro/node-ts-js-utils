import { Functions } from './lib/functions';
import { ExtensionContext } from 'vscode';
import { Logger } from './lib/logger';
export abstract class TsJsUtilsApp {
    protected currentMethod: string = '';
    protected className: string = '';

    constructor() {}

    private _logger: Logger | undefined;
    protected get logger(): Logger {
        if (!this._logger) {
            this._logger = global.nodeVs.logger;
        }
        this._logger.className = this.className;
        this._logger.methodName = this.currentMethod;
        return this._logger;
    }

    protected get projectName(): string {
        return global.nodeVs.projectName;
    }

    protected get contextVs(): ExtensionContext {
        return global.nodeVs.contextVs ? global.nodeVs.contextVs : Functions.convert<ExtensionContext>({});
    }
}
