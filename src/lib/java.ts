import { Console } from './console';
import { EShellType } from '../enum/shell-type';
import { FileSystem } from './file-system';
import { IJavaTest } from '../interface/java-test';
import { IJavaVm } from '../interface/java-vm';
import { TsJsUtilsApp } from '../ts-js-utils-app';

export class Java extends TsJsUtilsApp {
  constructor(
    private console: Console,
  ) {
    super();
  }

  /* -------------------------------------------------------------------------- */
  /*                                   PUBLIC                                   */
  /* -------------------------------------------------------------------------- */
  runTest(data: IJavaTest, shell: EShellType) {
    let command = this.mvnCmd;

    if (data.isFailIfNoTests !== true) {
      command += ` -DfailIfNoTests=false`;
    }

    if (data.isClean) {
      command += ` clean`;
    }

    // Insert class and method
    if (data.file.basename && data.file.basename.length > 0 && FileSystem.fileExist(data.file.dirname)) {
      const method = data.method ? `#${data.method}` : '';
      const className = data.file.basename.split('.').slice(0, -1).join('.');
      command += ` -Dtest=${className}${method}`;
    }

    // Insert others arguments
    if (data.otherArgs && data.otherArgs.length > 0) {
      data.otherArgs.forEach((arg) => {
        command += ` ${arg}`;
      });
    }

    // Run
    if (data.runCmdBeforeTest && data.runCmdBeforeTest.length > 0) {
      data.runCmdBeforeTest.forEach((cmd) => {
        this.console.execSyncRealTime({ cmd: cmd.cmd, cwd: cmd.cwd, shellType: shell });
      });
    }
    this.console.execSyncRealTime({ cmd: `${command} test`, cwd: data.pomDir, shellType: shell });
  }

  runVm(data: IJavaVm, shell: EShellType) {
    if (FileSystem.fileExist(data.jarFile)) {
      let cmd: string = this.javaExec;
      if (data.vmOptions) {
        data.vmOptions.forEach((option) => {
          cmd += ` ${option}`;
        });
      }
      cmd += ` -jar '${data.jarFile}'`;
      this.console.execSyncRealTime({ cmd: cmd, shellType: shell });
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                   PRIVATE                                  */
  /* -------------------------------------------------------------------------- */
  private readonly mvnCmd = 'mvn';
  private readonly javaExec = 'java';
}
