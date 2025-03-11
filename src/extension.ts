import * as vscode from 'vscode';
import { initeDatabaseActions } from './database/actions';
import { initeDatabaseCommands } from './database/commands';
import { initeDiagnostics } from './diagnostics';
import { initeCommonCommands } from './common/commands';
import { initeCommonActions } from './common/actions';
import { languageFileWatchers } from './common/languageDiagnostics';
import { initeClothesActions } from './clothes/actions';
import { initeActions } from './actions';
export function activate(context: vscode.ExtensionContext) {
	initeCommonCommands(context.subscriptions);
	initeDatabaseCommands(context.subscriptions);
	initeDiagnostics(context);
	initeActions(context);
}

export function deactivate() {
	languageFileWatchers.forEach(watcher => {
		watcher.close();
	});
}