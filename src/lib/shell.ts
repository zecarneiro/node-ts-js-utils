import { IVsTerminal } from './../interface/vs-terminals';
import { EShellType } from './../enum/shell-type';
import { Console } from './console';
import { FileSystem } from './file-system';
import { window } from 'vscode';
export class Shell {
  constructor(
    private fileSystem: FileSystem,
    private projectName: string,
  ) {
    this.onCloseTerminal();
  }

  private _bashVs: IVsTerminal;
  private _powershellVs: IVsTerminal;
  private _osxTerminalVs: IVsTerminal;

  private get bash(): string {
    if (this.fileSystem.isLinux) {
      return 'bash';
    } else if (this.fileSystem.isWindows) {
      const gitPath = FileSystem.resolvePath(`${Console.getEnv('PROGRAMFILES')}/Git`);
      return FileSystem.resolvePath(`${gitPath}/bin/bash.exe`);
    }
    return '';
  }

  private get bashVs(): IVsTerminal {
    const name = `${this.projectName} - Bash`;
    this._bashVs = { name: name, term: Console.getActiveTerminalVs(name) };
    if (!this._bashVs.term && this.existShell(EShellType.bash)) {
      this._bashVs.term = window.createTerminal({
        name: name,
        shellPath: this.bash,
      });
    }
    return this._bashVs;
  }

  private get powershell(): string {
    return 'powershell.exe';
  }

  private get powershellVs(): IVsTerminal {
    const name = `${this.projectName} - Powershell`;
    this._powershellVs = { name: name, term: Console.getActiveTerminalVs(name) };
    if (!this._powershellVs.term && this.existShell(EShellType.powershell)) {
      this._powershellVs.term = window.createTerminal({
        name: name,
        shellPath: this.powershell,
      });
    }
    return this._powershellVs;
  }

  private get terminalOsx(): string {
    return FileSystem.resolvePath('/Applications/Utilities/Terminal.app');
  }

  private get terminalOsxVs(): IVsTerminal {
    const name = `${this.projectName} - OSX`;
    this._osxTerminalVs = { name: name, term: Console.getActiveTerminalVs(name) };
    if (!this._osxTerminalVs.term && this.existShell(EShellType.terminalOsx)) {
      this._osxTerminalVs.term = window.createTerminal({
        name: this._osxTerminalVs.name,
        shellPath: this.terminalOsx,
      });
    }
    return this._osxTerminalVs;
  }

  private get system(): string {
    if (this.fileSystem.isLinux) {
      return this.bash;
    } else if (this.fileSystem.isWindows) {
      return this.powershell;
    } else if (this.fileSystem.isOsx) {
      return this.terminalOsx;
    }
    return '';
  }

  private get systemVs(): IVsTerminal {
    if (this.fileSystem.isLinux) {
      return this.bashVs;
    } else if (this.fileSystem.isWindows) {
      return this.powershellVs;
    } else if (this.fileSystem.isOsx) {
      return this.terminalOsxVs;
    }
    return undefined;
  }

  private onCloseTerminal() {
    window.onDidCloseTerminal((term) => {
      if (term.name === this.bashVs.name) {
        this.bashVs.term = undefined;
      } else if (term.name === this.powershellVs.name) {
        this.powershellVs.term = undefined;
      } else if (term.name === this.terminalOsxVs.name) {
        this.terminalOsxVs.term = undefined;
      }
      if (term.name === this.systemVs.name) {
        this.systemVs.term = undefined;
      }
    });
  }

  getShell(type?: EShellType): string {
    switch (type) {
      case EShellType.bash:
        return this.bash;
      case EShellType.powershell:
        return this.powershell;
      case EShellType.terminalOsx:
        return this.terminalOsx;
    }
    return this.system;
  }

  getShellVs(type?: EShellType): IVsTerminal {
    switch (type) {
      case EShellType.bash:
        return this.bashVs;
      case EShellType.powershell:
        return this.powershellVs;
      case EShellType.terminalOsx:
        return this.terminalOsxVs;
    }
    return this.systemVs;
  }

  existShell(shellType?: EShellType): boolean {
    if (shellType === EShellType.bash) {
      return (this.fileSystem.isLinux && !Console.findCommand(this.bash).hasError) || FileSystem.fileExist(this.bash);
    }
    if ((shellType === EShellType.powershell && !Console.findCommand(this.powershell).hasError) ||
      (shellType === EShellType.terminalOsx && !Console.findCommand(this.terminalOsx).hasError)
    ) {
      return true;
    }
    return false;
  }
}
