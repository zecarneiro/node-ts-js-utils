import { Functions } from './../global/functions';
import { FileSystem } from './../file-system';
import { EFileType } from '../../enum/Efile-type';
import { Shell } from './shell';
import { Response } from '../../entities/response';
import { spawnSync, SpawnSyncOptions } from 'child_process';
import { ICommandInfo } from '../../interface/Icomand-info';
import { EPlatformType } from '../../enum/Eplatform-type';
import { EErrorMessages } from '../../enum/Eerror-messages';
import { $, question } from 'zx';
import * as PromptSync from 'prompt-sync';
import { Logger } from '../logger';
import { EShellType } from '../..';

export class Console {
  constructor(
    protected logger: Logger,
    protected fileSystem: FileSystem,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                                  PROTECTED                                 */
  /* -------------------------------------------------------------------------- */
  protected _prompt: PromptSync.Prompt | undefined;
  protected _shell: Shell;
  protected get prompt(): PromptSync.Prompt {
    if (!this._prompt) {
      // eslint-disable-next-line new-cap
      this._prompt = PromptSync();
    }
    return this._prompt;
  }
  protected setDefaultCommandInfo(command: ICommandInfo): ICommandInfo {
    command.verbose = command.verbose === undefined ? true : command.verbose;
    command.isThrow = command.isThrow === undefined ? true : command.isThrow;
    return command;
  }
  protected execSpawnSync(cmd: string, args?: string[], options?: SpawnSyncOptions): Response<string> {
    const response = new Response<string>();
    const result = spawnSync(cmd, args, options);
    response.data = result.stdout?.toString().trim();
    response.errorMsg = result.stderr?.toString();
    response.error = result.error;
    response.status = result.status;
    return response;
  }
  protected getChangeDirCmd(cwd?: string): string {
    if (this.fileSystem.isLinux || this.fileSystem.isWindows || this.fileSystem.isOsx) {
      return `cd ${cwd}`;
    }
    return '';
  }

  /* -------------------------------------------------------------------------- */
  /*                                   PUBLIC                                   */
  /* -------------------------------------------------------------------------- */
  get shell(): Shell {
    if (!this._shell) {
      this._shell = new Shell(this, this.fileSystem);
    }
    return this._shell;
  }

  execSyncRealTime(command: ICommandInfo): Response<string> {
    command = this.setDefaultCommandInfo(command);
    if (command.verbose) {
      this.logger.emptyLine();
      this.logger.prompt(this.getCommandWithArgs(command));
    }
    const options: SpawnSyncOptions = {
      cwd: command.cwd,
      encoding: command.encoding ? command.encoding : 'utf8',
      env: command.env as NodeJS.ProcessEnv,
      shell: this.shell.getShell(command.shellType),
      stdio: 'inherit',
    };
    const response = this.execSpawnSync(command.cmd, command.args, options);
    if (command.realTimeSuccessCode && command.realTimeSuccessCode !== response.status) {
      response.errorMsg = 'Exit with error code: ' + response.status;
    }
    return Response.process(response, command.isThrow);
  }

  execSync(command: ICommandInfo): Response<string> {
    command = this.setDefaultCommandInfo(command);
    if (command.verbose) {
      this.logger.emptyLine();
      this.logger.prompt(this.getCommandWithArgs(command));
    }
    const options: SpawnSyncOptions = {
      cwd: command.cwd,
      encoding: command.encoding ? command.encoding : 'utf8',
      env: command.env as NodeJS.ProcessEnv,
      shell: this.shell.getShell(command.shellType),
    };
    const result = this.execSpawnSync(command.cmd, command.args, options);
    if (command.verbose) {
      result.print(this.logger);
    }
    return Response.process(result, command.isThrow);
  }

  async exec(command: ICommandInfo): Promise<Response<string>> {
    const cmd = this.getCommandWithArgs(command);
    command = this.setDefaultCommandInfo(command);
    const response = new Response<string>();
    $.verbose = command.verbose;
    $.prefix = '';
    $.shell = this.shell.getShell(command.shellType);
    const quote = $.quote;
    $.quote = (val: any) => val;
    if (command.cwd && this.fileSystem.fileExist(command.cwd) && this.fileSystem.fileType(command.cwd) === EFileType.directory) {
      await $`${this.getChangeDirCmd(command.cwd)}`;
    }
    const result = await $`${cmd}`;
    $.quote = quote;
    response.data = result.stdout;
    response.data = response.data?.trim();
    response.errorMsg = result.stderr?.trim();
    response.status = result.exitCode;
    return Response.process(response, command.isThrow);
  }

  readKeyboardSync(questionData: string, choices?: string[], canChoiceBeNull?: boolean): string {
    const dataNull = '%NULL%';
    choices = choices ? choices : [];
    let result = this.prompt(choices.length > 0 ? `${questionData} (${choices.toString()}) ` : questionData);
    if (canChoiceBeNull) {
      result = !result ? dataNull : result;
      choices.push(dataNull);
    }
    if (choices.length > 0 && !choices.includes(result)) {
      choices = Functions.removeElements(choices, dataNull);
      this.logger.error(new Error(`Please insert only (${choices.toString()})`));
      result = this.readKeyboardSync(questionData, choices, canChoiceBeNull);
    }
    return result === dataNull ? null : result;
  }

  async readKeyboard(questionData: string, choices?: string[]): Promise<string> {
    return await question(questionData, { choices: choices });
  }

  get getSeparatorEnv(): string | undefined {
    if (this.fileSystem.isLinux) {
      return ':';
    } else if (this.fileSystem.isWindows) {
      return ';';
    } else if (this.fileSystem.isOsx) {
      return undefined;
    } else {
      return undefined;
    }
  }

  getSeparator(platformType?: EPlatformType): string {
    let separator = '';
    if (platformType === EPlatformType.linux ||
      (!platformType && this.fileSystem.isLinux)
    ) {
      separator = '&&';
    } else if (platformType === EPlatformType.win32 ||
      (!platformType && this.fileSystem.isWindows)
    ) {
      separator = '&&';
    } else if (platformType === EPlatformType.darwin ||
      (!platformType && this.fileSystem.isOsx)
    ) {
      separator = '&&';
    }
    return separator;
  }

  setRootPermissionCmd(cmd: string): string {
    if (this.fileSystem.isLinux) {
      cmd = `sudo ${cmd}`;
    } else if (this.fileSystem.isWindows) {
      cmd = `Start-Process powershell -ArgumentList "${cmd}" -Verb runas`;
    }
    return cmd;
  }

  sequenceCommands(commands: string[], platformType?: EPlatformType): string {
    let commandSequency = '';
    commands.forEach((cmd) => {
      if (commandSequency.length === 0) {
        commandSequency = cmd;
      } else {
        commandSequency += ` ${this.getSeparator(platformType)} ${cmd}`;
      }
    });
    return commandSequency;
  }

  setEnv(key: string, value: string): boolean {
    if (key && key.length > 0) {
      if (!process.env[key] || (process.env[key] && process.env[key] !== value)) {
        process.env[key] = value;
      }
      return true;
    }
    return false;
  }

  getEnv(key: string): string | undefined {
    return process.env[key] ? process.env[key] : undefined;
  }

  getAllEnv(): NodeJS.ProcessEnv {
    return Functions.copyJsonData(process.env);
  }

  deleteEnv(key: string): boolean {
    if (process.env[key]) {
      process.env[key] = undefined;
      return true;
    }
    return false;
  }

  getCommandWithArgs(command: ICommandInfo): string {
    let info: string = command.cmd;
    command.args?.forEach((arg) => {
      info += ` ${arg}`;
    });
    return info;
  }

  exitConsoleProcess(code?: number) {
    process.exit(code);
  }

  findCommand(cmd: string, isThrow: boolean = true, encoding?: BufferEncoding): Response<string> {
    let response = new Response<string>();
    const options: SpawnSyncOptions = {
      encoding: encoding ? encoding : 'utf8',
      shell: this.shell.getShell(),
    };
    if (this.fileSystem.isLinux) {
      response = this.execSpawnSync('which', [cmd], options);
    } else if (this.fileSystem.isWindows) {
      response = this.execSpawnSync('where.exe', [cmd], options);
    } else {
      response.error = new Error(EErrorMessages.invalidPlatform);
    }
    return Response.process(response, isThrow);
  }

  isRunAsAdmin(): boolean {
    let response = new Response<string>();
    if (this.fileSystem.isWindows) {
      response = this.execSync({
        cmd: '(New-Object Security.Principal.WindowsPrincipal $([Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)',
        shellType: EShellType.powershell,
      });
      if (!response.hasError && response.data.includes('True')) return true;
    }
    return false;
  }
}
