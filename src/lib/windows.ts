import { FileSystem } from './file-system';
import { Functions } from './functions';
import { IVsRegisterCmd } from './../interface/vs-register-cmd';
import { Console } from './console';

import {
  InputBoxOptions,
  OpenDialogOptions,
  QuickPickItem,
  QuickPickOptions,
  StatusBarAlignment,
  TreeItem,
  Uri,
  ViewColumn,
  WebviewPanel,
  window,
  workspace,
} from 'vscode';
import { TsJsUtilsApp } from '../ts-js-utils-app';
import { IVsTreeItemWithChildren } from '../interface/vs-tree-item-with-children';
import { IVsTreeItem } from '../interface/vs-tree-item';
import { IVsActivityBarProvider } from '../interface/vs-activity-bar-provider-bar';
import { ActivityBarProvider } from '../entities/activity-bar-provider';
import { IVsStatusBar } from '../interface/vs-status-bar';

export class Windows extends TsJsUtilsApp {
  constructor(
    private console: Console,
  ) {
    super();
  }

  createActivityBarVs(data: IVsTreeItemWithChildren[] | IVsTreeItem[], id: string) {
    let activityBarData: any[] = [];
    const vsCmd: IVsRegisterCmd[] = [];
    const treeItem = (dataTreeItem: IVsTreeItem[] | undefined): TreeItem[] => {
      const newDataTree: TreeItem[] = [];
      if (dataTreeItem) {
        dataTreeItem.forEach((val) => {
          newDataTree.push(val.treeItem);
          vsCmd.push({
            callback: {
              caller: val.callback.caller,
              thisArg: val.callback.thisArg,
            },
            command: val.treeItem.command ? val.treeItem.command.command : '',
          });
        });
      }
      return newDataTree;
    };
    const createActivityBar = (data: IVsActivityBarProvider[] | TreeItem[], id: string) => {
      const activityBar = new ActivityBarProvider(data);
      activityBar.create(id);
    };
    for (const tree of data) {
      if (tree.hasChildren) {
        const dataWithChildren = Functions.convert<IVsTreeItemWithChildren>(tree);
        activityBarData.push({
          label: dataWithChildren.label,
          children: treeItem(dataWithChildren.children),
        });
      } else {
        const dataWithoutChildren = Functions.convert<IVsTreeItem>(tree);
        activityBarData = activityBarData.concat(treeItem([dataWithoutChildren]));
      }
    }
    createActivityBar(activityBarData, id);
    this.console.registerCommandVs(vsCmd);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   STATIC                                   */
  /* -------------------------------------------------------------------------- */
  static async createInputBoxVs(inputBoxOptions: InputBoxOptions): Promise<string | undefined> {
    inputBoxOptions.ignoreFocusOut = false;
    return await window.showInputBox(inputBoxOptions);
  }

  static createStatusBarVs(options: IVsStatusBar) {
    const statusbar = window.createStatusBarItem(StatusBarAlignment.Right, 0);
    statusbar.text = options.text;
    statusbar.command = Functions.convert<string>(options.command);
    statusbar.tooltip = options.tooltip;
    statusbar.show();
  }

  static async createQuickPickVs<T extends QuickPickItem|QuickPickItem[]|string|string[]>(items: QuickPickItem[]|string[], options: QuickPickOptions, isString?: boolean): Promise<T|undefined> {
    let result: QuickPickItem|QuickPickItem[]|string|string[]|undefined;
    if (isString) {
      result = await window.showQuickPick(items as string[], options);
    } else {
      result = await window.showQuickPick<QuickPickItem>(items as QuickPickItem[], options);
    }
    return Functions.convert<T>(result);
  }

  static async showOpenDialogVs<T extends Uri|Uri[]>(options: OpenDialogOptions): Promise<T|undefined> {
    const result = await window.showOpenDialog(options);
    return !options.canSelectMany && result && result[0] ? Functions.convert<T>(result[0]) : Functions.convert<T>(result);
  }

  static showWebViewHTMLVs(body: string, title?: string, css?: string, language?: string) {
    const key = 'webview';
    let webViewPanel = Functions.getGlobalData<WebviewPanel>(key, true);
    if (!webViewPanel) {
      webViewPanel = window.createWebviewPanel(
        'WebView',
        global.nodeVs.projectName,
        ViewColumn.One,
        {},
      );
      Functions.setGlobalData(key, webViewPanel);
    }
    const data: string = `<!DOCTYPE html>
    <html lang="${language ? language : 'en'}">
    <style>
      title-body {
        align: center;
      }
      ${css ? css : ''}
    </style>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${global.nodeVs.projectName}</title>
    </head>
    <body>
      <h1 class="title-body">${title}</h1>
      ${body}
    </body>
    </html>`;
    webViewPanel.webview.html = data;
  }

  static showTextDocumentVs(file: string) {
    workspace.openTextDocument(FileSystem.getUriFileVs(file)).then((doc) => {
      window.showTextDocument(doc);
    });
  }
}
