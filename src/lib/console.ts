import { EFileType } from './../enum/file-type';
import { IVsRegisterCmd } from './../interface/vs-register-cmd';
import { Shell } from './shell';
import { Functions } from './functions';
import { Response } from './../entities/response';
import { spawnSync, SpawnSyncOptions } from 'child_process';
import { ICommandInfo } from '../interface/comand-info';
import { EPlatformType } from '../enum/platform-type';
import { EErrorMessages } from '../enum/error-messages';
import { FileSystem } from './file-system';
import { TsJsUtilsApp } from '../ts-js-utils-app';
import { $, question } from 'zx';
import * as PromptSync from 'prompt-sync';
import { commands, Terminal, TerminalOptions, window } from 'vscode';

export class Console extends TsJsUtilsApp {
  constructor(
    protected fileSystem: FileSystem,
  ) {
    super();
  }

  /* -------------------------------------------------------------------------- */
  /*                                   PRIVATE                                  */
  /* -------------------------------------------------------------------------- */
  private _prompt: PromptSync.Prompt | undefined;
  private _shell: Shell|undefined;
  private get prompt(): PromptSync.Prompt {
    if (!this._prompt) {
      // eslint-disable-next-line new-cap
      this._prompt = PromptSync();
    }
    return this._prompt;
  }
  private setDefaultCommandInfo(command: ICommandInfo): ICommandInfo {
    command.verbose = command.verbose === undefined ? true : command.verbose;
    command.isThrow = command.isThrow === undefined ? true : command.isThrow;
    return command;
  }
  private getChangeDirCmd(cwd?: string): string {
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
      this._shell = new Shell(this.fileSystem, this.projectName);
    }
    return this._shell;
  }

  execSyncRealTime(command: ICommandInfo): Response<string> {
    command = this.setDefaultCommandInfo(command);
    if (command.verbose) {
      this.logger.emptyLine();
      this.logger.prompt(Console.getCommandWithArgs(command));
    }
    const options: SpawnSyncOptions = {
      cwd: command.cwd,
      encoding: command.encoding ? command.encoding : 'utf8',
      env: command.env as NodeJS.ProcessEnv,
      shell: this.shell.getShell(command.shellType),
      stdio: 'inherit',
    };
    const response = Console.execSpawnSync(command.cmd, command.args, options);
    if (command.realTimeSuccessCode && command.realTimeSuccessCode !== response.status) {
      response.errorMsg = 'Exit with error code: ' + response.status;
    }
    return Response.process(response, command.isThrow);
  }

  execSync(command: ICommandInfo): Response<string> {
    command = this.setDefaultCommandInfo(command);
    if (command.verbose) {
      this.logger.emptyLine();
      this.logger.prompt(Console.getCommandWithArgs(command));
    }
    const options: SpawnSyncOptions = {
      cwd: command.cwd,
      encoding: command.encoding ? command.encoding : 'utf8',
      env: command.env as NodeJS.ProcessEnv,
      shell: this.shell.getShell(command.shellType),
    };
    const result = Console.execSpawnSync(command.cmd, command.args, options);
    if (command.verbose) {
      result.print();
    }
    return Response.process(result, command.isThrow);
  }

  async exec(command: ICommandInfo): Promise<Response<string>> {
    const cmd = Console.getCommandWithArgs(command);
    command = this.setDefaultCommandInfo(command);
    if (command.verbose) {
      this.logger.emptyLine();
      this.logger.prompt(cmd);
    }
    const response = new Response<string>();
    $.verbose = command.verbose;
    $.prefix = '';
    $.shell = this.shell.getShell(command.shellType);
    const quote = $.quote;
    $.quote = (val: any) => val;
    if (command.cwd && FileSystem.fileExist(command.cwd) && FileSystem.fileType(command.cwd) === EFileType.directory) {
      await $`${this.getChangeDirCmd(command.cwd)}`;
    }
    const result = await $`${cmd}`;
    $.quote = quote;
    response.data = result.stdout;
    response.data = response.data?.trim();
    response.errorMsg = result.stderr?.trim();
    response.status = result.exitCode;
    if (command.verbose && Functions.isVscode) {
      response.print();
    }
    return Response.process(response, command.isThrow);
  }

  execVs(command: ICommandInfo) {
    const cmd = Console.getCommandWithArgs(command);
    const terminal = this.shell.getShellVs(command.shellType);
    if (command.cwd) {
      terminal.term?.sendText(`cd "${command.cwd}"`);
    }
    terminal.term?.show(true);
    terminal.term?.sendText(cmd);
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
      this.logger.error(`Please insert only (${choices.toString()})`);
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

  createTerminalVs(options: TerminalOptions): Terminal | undefined {
    options['shellPath'] = !options.shellPath ? this.shell.getShell() : options.shellPath;
    options['name'] = this.projectName + ': ' + options?.name;
    let terminal = Console.getActiveTerminalVs(options.name);
    if (!terminal) {
      terminal = window.createTerminal(options);
    }
    return terminal;
  }

  registerCommandVs(data: IVsRegisterCmd[]) {
    data.forEach((value) => {
      if (value.callback) {
        const register = commands.registerCommand(value.command, value.callback?.caller, value.callback?.thisArg);
        this.contextVs?.subscriptions.push(register);
      }
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                                   STATIC                                   */
  /* -------------------------------------------------------------------------- */
  static setEnv(key: string, value: string): boolean {
    if (key && key.length > 0) {
      if (!process.env[key] || (process.env[key] && process.env[key] !== value)) {
        process.env[key] = value;
      }
      return true;
    }
    return false;
  }

  static getEnv(key: string): string | undefined {
    return process.env[key] ? process.env[key] : undefined;
  }

  static getAllEnv(): NodeJS.ProcessEnv {
    return Functions.copyJsonData(process.env);
  }

  static deleteEnv(key: string): boolean {
    if (process.env[key]) {
      process.env[key] = undefined;
      return true;
    }
    return false;
  }

  static getCommandWithArgs(command: ICommandInfo): string {
    let info: string = command.cmd;
    command.args?.forEach((arg) => {
      info += ` ${arg}`;
    });
    return info;
  }

  static exitConsoleProcess(code?: number) {
    process.exit(code);
  }

  static execSpawnSync(cmd: string, args?: string[], options?: SpawnSyncOptions): Response<string> {
    const response = new Response<string>();
    const result = spawnSync(cmd, args, options);
    response.data = result.stdout?.toString().trim();
    response.errorMsg = result.stderr?.toString();
    response.error = result.error;
    response.status = result.status;
    return response;
  }

  static findCommand(cmd: string, isThrow: boolean = true, encoding?: BufferEncoding): Response<string> {
    const fileSystem = new FileSystem();
    const shell = new Shell(fileSystem, global.nodeVs.projectName);
    let response = new Response<string>();
    const options: SpawnSyncOptions = {
      encoding: encoding ? encoding : 'utf8',
      shell: shell.getShell(),
    };
    if (fileSystem.isLinux) {
      response = Console.execSpawnSync('which', [cmd], options);
    } else if (fileSystem.isWindows) {
      response = Console.execSpawnSync('where.exe', [cmd], options);
    } else {
      response.error = new Error(EErrorMessages.invalidPlatform);
    }
    return Response.process(response, isThrow);
  }

  static getActiveTerminalVs(name: string): Terminal | undefined {
    return window.terminals.find((t) => t.name === name);
  }

  static async execCommandVs<T>(command: string, ...rest: any[]): Promise<T | undefined> {
    return await commands.executeCommand<T>(command, rest);
  }

  static async closeTerminalVs(processId: number) {
    await Console.execCommandVs('workbench.action.terminal.kill', processId);
  }
}
