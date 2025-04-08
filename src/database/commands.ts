import { match } from 'assert';
import * as vscode from 'vscode';
import { generateRandomGuid } from './actions';

export function initeDatabaseCommands(subscriptions: vscode.Disposable[]) {
    const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
    let files: string[] = config.get('preposedDatabaseFiles') ?? [];
    vscode.commands.executeCommand('setContext', 'sct.preposedDatabaseFiles', files);
    subscriptions.push(vscode.commands.registerTextEditorCommand('survivalcraft-content-toolkit.insertRandomGuid', insertRandomGuid));
    subscriptions.push(vscode.commands.registerTextEditorCommand('survivalcraft-content-toolkit.insertClipboardWithRandomizedGuids', insertClipboardWithRandomizedGuids));
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

export function addToPreDatabaseFiles(uri: any, noWarning: boolean = false) {
    if (uri?.fsPath) {
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        let files: string[] = config.get('preposedDatabaseFiles') ?? [];
        if (files) {
            if (files.includes(uri.fsPath)) {
                if (!noWarning) {
                    vscode.window.showWarningMessage(vscode.l10n.t("messages.alreadyInPreFiles", vscode.l10n.t("main.database")));
                }
            } else {
                files.push(uri.fsPath);
                config.update('preposedDatabaseFiles', files, vscode.ConfigurationTarget.Global);
                vscode.commands.executeCommand('setContext', 'sct.preposedDatabaseFiles', files);
                vscode.window.showInformationMessage(vscode.l10n.t("messages.addedToPreFiles", vscode.l10n.t("main.database")));
                if (!vscode.workspace.textDocuments.some(doc => doc.uri.fsPath === uri.fsPath)) {
                    vscode.workspace.openTextDocument(uri.fsPath);
                }
            }
        }
    }
}

function removeFromPreDatabaseFiles(uri: any) {
    if (uri?.fsPath) {
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        let files: string[] = config.get('preposedDatabaseFiles') ?? [];
        if (files && files.includes(uri.fsPath)) {
            files = files.filter(file => file !== uri.fsPath);
            config.update('preposedDatabaseFiles', files, vscode.ConfigurationTarget.Global);
            vscode.commands.executeCommand('setContext', 'sct.preposedDatabaseFiles', files);
            vscode.window.showInformationMessage(vscode.l10n.t("messages.removedFromPreFiles", vscode.l10n.t("main.database")));
            if (!vscode.workspace.textDocuments.some(doc => doc.uri.fsPath === uri.fsPath)) {
                removeFromPreDatabaseFiles(uri.fsPath);
            }
        }
    }
}

const tagWithGuidPattern = /<\w+.*?Guid="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}".*?>/;
const guidPattern = /(?<=Guid=")[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?=" ?(?!new-Value))/g;
function insertClipboardWithRandomizedGuids() {
    vscode.env.clipboard.readText().then(clipboard => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || clipboard.length === 0) {
            return;
        }
        if (clipboard.search(tagWithGuidPattern) === -1) {
            vscode.window.showWarningMessage(vscode.l10n.t("messages.clipboardNotContainsTagWithGuid"));
            return;
        }
        const result = clipboard.replace(guidPattern, match => generateRandomGuid());
        editor.edit(editBuilder => {
            editBuilder.insert(editor.selection.active, result);
        });
    });
}