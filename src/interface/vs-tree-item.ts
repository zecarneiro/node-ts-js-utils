import { ICallback } from './callback';
import { TreeItem } from 'vscode';

export interface IVsTreeItem {
    treeItem: TreeItem,
    callback?: ICallback,
    hasChildren?: boolean;
}
