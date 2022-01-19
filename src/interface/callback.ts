export interface ICallback {
    caller: (...args: any[]) => any,
    thisArg?: any
}
