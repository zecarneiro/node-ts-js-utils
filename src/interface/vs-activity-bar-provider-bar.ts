import { TreeItem, TreeItemCollapsibleState } from 'vscode';

export interface IVsActivityBarProvider {
    label: string;
    children?: TreeItem[];
    collapsibleState?: TreeItemCollapsibleState;
}
