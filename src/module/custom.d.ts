/* eslint-disable no-unused-vars */
import { INodeTsJsUtilsGlobal } from '../interface/Inode-ts-js-utils-global';

declare global {
    namespace NodeJS {
        interface Global {
            nodeTsJsUtils: INodeTsJsUtilsGlobal<any>,
        }
    }
}
export default global;
