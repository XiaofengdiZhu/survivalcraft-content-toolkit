import * as vscode from 'vscode';
import { initeCommonCommands } from './common/commands';
import { initeDatabaseCommands } from './database/commands';
import { initeBlocksDataCommands } from './blocksdata/commands';
import { initeWidgetsCommands } from './widgets/commands';
export function initeCommands(context: vscode.ExtensionContext) {
    initeCommonCommands(context.subscriptions);
    initeBlocksDataCommands(context.subscriptions);
    initeDatabaseCommands(context.subscriptions);
    initeWidgetsCommands(context);
}