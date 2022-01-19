import { IVsTreeItem } from './vs-tree-item';
import { TreeItemCollapsibleState } from 'vscode';

export interface IVsTreeItemWithChildren {
    label: string;
    collapsibleState?: TreeItemCollapsibleState;
    children?: IVsTreeItem[];
    hasChildren?: boolean;
}
