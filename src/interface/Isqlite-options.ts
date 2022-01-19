import { ESqliteOutputFormat } from '../enum/Esqlite-output-format';
export interface ISqliteOptions {
    file: string,
    outputFormat?: ESqliteOutputFormat, // Default = json
    encoding?: BufferEncoding,
    resultFile?: string
}
