import * as vscode from 'vscode';
import { closeBlocksDataDiagnostics, readAndWatchBlocksDataFile } from './diagnostics';

export function initeBlocksDataCommands(subscriptions: vscode.Disposable[]) {
    const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
    let files: string[] = config.get('preposedBlocksDataFiles') ?? [];
    vscode.commands.executeCommand('setContext', 'sct.preposedBlocksDataFiles', files);
    subscriptions.push(vscode.commands.registerCommand('survivalcraft-content-toolkit.addToPreBlocksDataFiles', addToPrePreBlocksDataFiles));
    subscriptions.push(vscode.commands.registerCommand('survivalcraft-content-toolkit.removeFromPreBlocksDataFiles', removeFromPrePreBlocksDataFiles));
}

function addToPrePreBlocksDataFiles(arg: any) {
    if (arg?.fsPath) {
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        let files: string[] = config.get('preposedBlocksDataFiles') ?? [];
        if (files) {
            if (files.includes(arg.fsPath)) {
                vscode.window.showWarningMessage(vscode.l10n.t("messages.alreadyInPreFiles", vscode.l10n.t("main.blocksData")));
            } else {
                files.push(arg.fsPath);
                vscode.workspace.getConfiguration('survivalcraft-content-toolkit').update('preposedBlocksDataFiles', files, vscode.ConfigurationTarget.Global);
                vscode.commands.executeCommand('setContext', 'sct.preposedBlocksDataFiles', files);
                vscode.window.showInformationMessage(vscode.l10n.t("messages.addedToPreFiles", vscode.l10n.t("main.blocksData")));
                readAndWatchBlocksDataFile(arg.fsPath);
            }
        }
    }
}

function removeFromPrePreBlocksDataFiles(arg: any) {
    if (arg?.fsPath) {
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        let files: string[] = config.get('preposedBlocksDataFiles') ?? [];
        if (files && files.includes(arg.fsPath)) {
            files = files.filter(file => file !== arg.fsPath);
            config.update('preposedBlocksDataFiles', files, vscode.ConfigurationTarget.Global);
            vscode.commands.executeCommand('setContext', 'sct.preposedBlocksDataFiles', files);
            vscode.window.showInformationMessage(vscode.l10n.t("messages.removedFromPreFiles", vscode.l10n.t("main.blocksData")));
            closeBlocksDataDiagnostics(arg.fsPath, false);
        }
    }
}