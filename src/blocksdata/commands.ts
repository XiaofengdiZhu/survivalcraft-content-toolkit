import * as vscode from 'vscode';
import { closeBlocksDataDiagnostics, readAndWatchBlocksDataFile } from './diagnostics';

interface QuickSuggestions {
    other?: string | boolean;
    comments?: string | boolean;
    strings?: string | boolean;
}
export function initeBlocksDataCommands(subscriptions: vscode.Disposable[]) {
    const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
    let files: string[] = config.get('preposedBlocksDataFiles') ?? [];
    vscode.commands.executeCommand('setContext', 'sct.preposedBlocksDataFiles', files);
    subscriptions.push(vscode.commands.registerCommand('survivalcraft-content-toolkit.addToPreBlocksDataFiles', addToPreBlocksDataFiles));
    subscriptions.push(vscode.commands.registerCommand('survivalcraft-content-toolkit.removeFromPreBlocksDataFiles', removeFromPrePreBlocksDataFiles));
    const config1 = vscode.workspace.getConfiguration("editor", { languageId: "xml" });
    const quickSuggestions: QuickSuggestions = config1.get("quickSuggestions") ?? {};
    if (quickSuggestions.strings === "off") {
        quickSuggestions.strings = "on";
        config1.update("quickSuggestions", quickSuggestions, vscode.ConfigurationTarget.Global);
    }
}

export function addToPreBlocksDataFiles(uri: any, noWarning: boolean = false) {
    if (uri?.fsPath) {
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        let files: string[] = config.get('preposedBlocksDataFiles') ?? [];
        if (files) {
            if (files.includes(uri.fsPath)) {
                if (!noWarning) {
                    vscode.window.showWarningMessage(vscode.l10n.t("messages.alreadyInPreFiles", vscode.l10n.t("main.blocksData")));
                }
            } else {
                files.push(uri.fsPath);
                config.update('preposedBlocksDataFiles', files, vscode.ConfigurationTarget.Global);
                vscode.commands.executeCommand('setContext', 'sct.preposedBlocksDataFiles', files);
                vscode.window.showInformationMessage(vscode.l10n.t("messages.addedToPreFiles", vscode.l10n.t("main.blocksData")));
                readAndWatchBlocksDataFile(uri.fsPath);
            }
        }
    }
}

function removeFromPrePreBlocksDataFiles(uri: any) {
    if (uri?.fsPath) {
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        let files: string[] = config.get('preposedBlocksDataFiles') ?? [];
        if (files && files.includes(uri.fsPath)) {
            files = files.filter(file => file !== uri.fsPath);
            config.update('preposedBlocksDataFiles', files, vscode.ConfigurationTarget.Global);
            vscode.commands.executeCommand('setContext', 'sct.preposedBlocksDataFiles', files);
            vscode.window.showInformationMessage(vscode.l10n.t("messages.removedFromPreFiles", vscode.l10n.t("main.blocksData")));
            closeBlocksDataDiagnostics(uri.fsPath, false);
        }
    }
}