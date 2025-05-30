import * as vscode from 'vscode';
import { isClothesFile } from './diagnostics';
import { replaceRootElementToMod, setXsd } from '../actions';

export function initeClothesActions(subscriptions: vscode.Disposable[]) {
    subscriptions.push(vscode.languages.registerCodeActionsProvider("xml", new ClothesActionProvider(), {
        providedCodeActionKinds: ClothesActionProvider.providedCodeActionKinds
    }));
};

class ClothesActionProvider implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeAction[]> {
        const actions: vscode.CodeAction[] = [];
        if (!isClothesFile(document.fileName)) {
            return actions;
        }
        for (const diagnostic of context.diagnostics) {
            switch (diagnostic.code) {
                case 'xsdNotSet': {
                    const action = setXsd("Clothes", document, diagnostic);
                    if (action) {
                        actions.push(action);
                    }
                    break;
                }
                case 'cvc-elt.1.a': {
                    if (range.start.line === 0 || range.start.line === 1) {
                        actions.push(replaceRootElementToMod(document, diagnostic));
                    }
                    break;
                }
            }
        }
        return actions;
    }
}