import { Functions } from './../lib/global/functions';
import { Logger } from '../lib/logger';
export interface IGlobal {
  projectName: string,
  logger: Logger,
  functions: Functions,
}
