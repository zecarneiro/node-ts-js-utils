export interface IFileInfo {
    filename: string | undefined,
    basename: string,
    dirname: string,
    extension: string,
    basenameWithoutExtension: string,
    isExtension: (data: string[]) => boolean,
}
