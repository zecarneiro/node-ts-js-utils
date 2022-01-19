import { WorkspaceConfiguration } from 'vscode';

interface IVsAuthor {
    name: string
}

interface IVsLocation {
    fsPath: string,
    path: string,
    scheme: string,
}

export interface IVsExtensionInfo {
    author: IVsAuthor,
    publisher: string,
    name: string;
    displayName: string,
    version: string,
    main: string,
    id: string,
    configData: WorkspaceConfiguration,
    uuid: any,
    extensionLocation: IVsLocation,
}
