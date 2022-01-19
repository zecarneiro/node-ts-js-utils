import { ESqliteOutputFormat } from '../enum/sqlite-output-format';
export interface ISqliteOptions {
    file: string,
    outputFormat?: ESqliteOutputFormat, // Default = json
    encoding?: BufferEncoding,
    resultFile?: string
}
