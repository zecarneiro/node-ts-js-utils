import { Command } from 'vscode';

export interface IVsStatusBar {
    text: string,
    command: string | Command | undefined,
    tooltip?: string
}
