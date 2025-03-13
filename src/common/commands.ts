import * as vscode from 'vscode';
import { closeLanguageDiagnostics, readAndWatchLanguageFile } from './languageDiagnostics';

export function initeCommonCommands(subscriptions: vscode.Disposable[]) {
    const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
    let files: string[] = config.get('preposedLanguageFiles') ?? [];
    vscode.commands.executeCommand('setContext', 'sct.preposedLanguageFiles', files);
    subscriptions.push(vscode.commands.registerCommand('survivalcraft-content-toolkit.addToPreLanguageFiles', addToPrePreLanguageFiles));
    subscriptions.push(vscode.commands.registerCommand('survivalcraft-content-toolkit.removeFromPreLanguageFiles', removeFromPrePreLanguageFiles));
    subscriptions.push(vscode.commands.registerCommand('survivalcraft-content-toolkit.openFile', openFile));
}

function addToPrePreLanguageFiles(arg: any) {
    if (arg?.fsPath) {
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        let files: string[] = config.get('preposedLanguageFiles') ?? [];
        if (files) {
            if (files.includes(arg.fsPath)) {
                vscode.window.showWarningMessage(vscode.l10n.t("messages.alreadyInPreFiles", vscode.l10n.t("main.language")));
            } else {
                files.push(arg.fsPath);
                vscode.workspace.getConfiguration('survivalcraft-content-toolkit').update('preposedLanguageFiles', files, vscode.ConfigurationTarget.Global);
                vscode.commands.executeCommand('setContext', 'sct.preposedLanguageFiles', files);
                vscode.window.showInformationMessage(vscode.l10n.t("messages.addedToPreFiles", vscode.l10n.t("main.language")));
                readAndWatchLanguageFile(arg.fsPath);
            }
        }
    }
}

function removeFromPrePreLanguageFiles(arg: any) {
    if (arg?.fsPath) {
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        let files: string[] = config.get('preposedLanguageFiles') ?? [];
        if (files && files.includes(arg.fsPath)) {
            files = files.filter(file => file !== arg.fsPath);
            config.update('preposedLanguageFiles', files, vscode.ConfigurationTarget.Global);
            vscode.commands.executeCommand('setContext', 'sct.preposedLanguageFiles', files);
            vscode.window.showInformationMessage(vscode.l10n.t("messages.removedFromPreFiles", vscode.l10n.t("main.language")));
            closeLanguageDiagnostics(arg.fsPath, false);
        }
    }
}

function openFile(formatedUri: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
    vscode.workspace.openTextDocument(vscode.Uri.parse(formatedUri)).then(document => {
        vscode.window.showTextDocument(document, {
            selection: new vscode.Range(new vscode.Position(startLine, startCharacter), new vscode.Position(endLine, endCharacter))
        });
    });
}