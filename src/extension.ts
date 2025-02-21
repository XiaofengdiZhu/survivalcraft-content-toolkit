import * as vscode from 'vscode';
import { initeDatabaseActions } from './database/actions';
import { initeDatabaseCommands } from './database/commands';
import { initeDiagnostics } from './diagnostics';
import { initeCommonCommands } from './common/commands';
import { initeCommonActions } from './common/actions';
import { languageFileWatchers } from './common/languageDiagnostics';
import { initeClothesActions } from './clothes/actions';
export function activate(context: vscode.ExtensionContext) {
	initeCommonCommands(context.subscriptions);
	initeCommonActions(context.subscriptions);
	initeDatabaseCommands(context.subscriptions);
	initeDatabaseActions(context.subscriptions);
	initeClothesActions(context.subscriptions);
	initeDiagnostics(context);
}

export function deactivate() {
	languageFileWatchers.forEach(watcher => {
		watcher.close();
	});
}