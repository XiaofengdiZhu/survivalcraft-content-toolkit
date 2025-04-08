import * as vscode from 'vscode';
import { initeDiagnostics } from './diagnostics';
import { languageFileWatchers } from './common/languageDiagnostics';
import { initeActions } from './actions';
import { initeCommands } from './commands';
import { blocksDataFileWatchers } from './blocksdata/diagnostics';
import { webviewPanel } from './widgets/commands';
export function activate(context: vscode.ExtensionContext) {
	initeCommands(context);
	initeDiagnostics(context);
	initeActions(context);
}

export function deactivate() {
	if (webviewPanel) {
		webviewPanel.dispose();
	}
	languageFileWatchers.forEach(watcher => {
		watcher.close();
	});
	blocksDataFileWatchers.forEach(watcher => {
		watcher.close();
	});
}