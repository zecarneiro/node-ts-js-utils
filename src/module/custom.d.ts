/* eslint-disable no-unused-vars */
import { TsJsUtilsGlobal } from '../interface/ts-js-utils-global';

declare global {
    namespace NodeJS {
        interface Global {
            nodeVs: TsJsUtilsGlobal<any>,
        }
    }
}
export default global;
