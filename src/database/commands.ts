import * as vscode from 'vscode';

export function initeDatabaseCommands(subscriptions: vscode.Disposable[]) {
    const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
    let files: string[] = config.get('preposedDatabaseFiles') ?? [];
    vscode.commands.executeCommand('setContext', 'sct.preposedDatabaseFiles', files);
    subscriptions.push(vscode.commands.registerTextEditorCommand('survivalcraft-content-toolkit.insertRandomGuid', insertRandomGuid));
    subscriptions.push(vscode.commands.registerCommand('survivalcraft-content-toolkit.addToPreDatabaseFiles', addToPreDatabaseFiles));
    subscriptions.push(vscode.commands.registerCommand('survivalcraft-content-toolkit.removeFromPreDatabaseFiles', removeFromPreDatabaseFiles));
}

function insertRandomGuid(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) {
    const position = textEditor.selection.active;
    const previousPosition = position.with(position.line, Math.max(0, position.character - 1));
    const range = new vscode.Range(previousPosition, position);
    const char = textEditor.document.getText(range);
    const noSpaceAtStartOrBefore = char !== '' && char !== ' ';
    vscode.commands.executeCommand('editor.action.insertSnippet', {
        snippet: `${noSpaceAtStartOrBefore ? ' ' : ''}Guid=\"$UUID\"`
    });
}

function addToPreDatabaseFiles(arg: any) {
    if (arg?.fsPath) {
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        let files: string[] = config.get('preposedDatabaseFiles') ?? [];
        if (files) {
            if (files.includes(arg.fsPath)) {
                vscode.window.showWarningMessage(vscode.l10n.t("messages.alreadyInPreDatabaseFiles", arg.fsPath));
            } else {
                files.push(arg.fsPath);
                config.update('preposedDatabaseFiles', files, vscode.ConfigurationTarget.Global);
                vscode.commands.executeCommand('setContext', 'sct.preposedDatabaseFiles', files);
                vscode.window.showInformationMessage(vscode.l10n.t("messages.addedToPreDatabaseFiles", arg.fsPath));
                if(!vscode.workspace.textDocuments.some(doc => doc.uri.fsPath === arg.fsPath)){
                    vscode.workspace.openTextDocument(arg.fsPath);
                }
            }
        }
    }
}

function removeFromPreDatabaseFiles(arg: any) {
    if (arg?.fsPath) {
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        let files: string[] = config.get('preposedDatabaseFiles') ?? [];
        if (files && files.includes(arg.fsPath)) {
            files = files.filter(file => file !== arg.fsPath);
            config.update('preposedDatabaseFiles', files, vscode.ConfigurationTarget.Global);
            vscode.commands.executeCommand('setContext', 'sct.preposedDatabaseFiles', files);
            vscode.window.showInformationMessage(vscode.l10n.t("messages.removedFromPreDatabaseFiles", arg.fsPath));
            if(!vscode.workspace.textDocuments.some(doc => doc.uri.fsPath === arg.fsPath)){
                removeFromPreDatabaseFiles(arg.fsPath);
            }
        }
    }
}