import { Functions } from './lib/global/functions';
import { FileSystem } from './lib/global/file-system';
import { Logger } from './lib/global/logger';
export abstract class ProcessorUtils {
    protected currentMethod: string = '';
    protected className: string = '';

    constructor() {}

    protected get logger(): Logger {
        const logger = global.nodeTsJsUtils.logger;
        logger.className = this.className;
        logger.methodName = this.currentMethod;
        return logger;
    }
    protected get fileSystem(): FileSystem {
        return global.nodeTsJsUtils.fileSystem;
    }
    protected get functions(): Functions {
        return global.nodeTsJsUtils.functions;
    }

    protected get projectName(): string {
        return global.nodeTsJsUtils.projectName;
    }
}
