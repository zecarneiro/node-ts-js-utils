import { Console } from './console';
import { EShellType } from '../../enum/Eshell-type';
import { ProcessorUtils } from '../../processor-utils';
export class Shell extends ProcessorUtils {
  constructor(
    private console: Console,
  ) {
    super();
  }

  private get bash(): string {
    if (this.fileSystem.isLinux) {
      return 'bash';
    } else if (this.fileSystem.isWindows) {
      const gitPath = this.fileSystem.resolvePath(`${this.console.getEnv('PROGRAMFILES')}/Git`);
      return this.fileSystem.resolvePath(`${gitPath}/bin/bash.exe`);
    }
    return '';
  }

  private get powershell(): string {
    return 'powershell.exe';
  }

  private get terminalOsx(): string {
    return this.fileSystem.resolvePath('/Applications/Utilities/Terminal.app');
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

  existShell(shellType?: EShellType): boolean {
    if (shellType === EShellType.bash) {
      return (this.fileSystem.isLinux && !this.console.findCommand(this.bash).hasError) || this.fileSystem.fileExist(this.bash);
    }
    if ((shellType === EShellType.powershell && !this.console.findCommand(this.powershell).hasError) ||
      (shellType === EShellType.terminalOsx && !this.console.findCommand(this.terminalOsx).hasError)
    ) {
      return true;
    }
    return false;
  }
}
