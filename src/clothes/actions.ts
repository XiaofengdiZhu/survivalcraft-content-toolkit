import * as vscode from 'vscode';
import { isClothesFile } from './diagnostics';

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
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        for (const diagnostic of context.diagnostics) {
            switch (diagnostic.code) {
                case 'xsdNotSet': {
                    const oldStartTag = document.getText(diagnostic.range);
                    const match = oldStartTag.match(/<\w+/);
                    if (match) {
                        const action = new vscode.CodeAction(vscode.l10n.t("actions.setClothesXsd"), vscode.CodeActionKind.QuickFix);
                        action.edit = new vscode.WorkspaceEdit();
                        const xmlnsXsi = ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';
                        action.edit.insert(document.uri, diagnostic.range.start.translate(0, match[0].length), `${oldStartTag.includes(xmlnsXsi) ? '' : xmlnsXsi} xsi:noNamespaceSchemaLocation="${config.get('defaultClothesXsdPath') ?? 'https://gitee.com/THPRC/survivalcraft-api/raw/SCAPI1.8/Survivalcraft/Content/Assets/Clothes.xsd'}"`);
                        action.diagnostics = [diagnostic];
                        action.isPreferred = true;
                        actions.push(action);
                    }
                    break;
                }
                case 'cvc-elt.1.a': {
                    if (range.start.line === 0 || range.start.line === 1) {
                        const action = new vscode.CodeAction(vscode.l10n.t("actions.replaceRootElementToMod"), vscode.CodeActionKind.QuickFix);
                        const oldEndTag = `</${document.getText(diagnostic.range)}>`;
                        action.edit = new vscode.WorkspaceEdit();
                        action.edit.replace(document.uri, diagnostic.range, `Mod`);
                        //将根元素的结束标签也替换为</Mod>
                        const fullDocumentText = document.getText();
                        const endTagIndex = fullDocumentText.indexOf(oldEndTag);
                        if (endTagIndex !== -1) {
                            const endTagRange = new vscode.Range(
                                document.positionAt(endTagIndex),
                                document.positionAt(endTagIndex + oldEndTag.length)
                            );
                            action.edit.replace(document.uri, endTagRange, `</Mod>`);
                        }
                        action.diagnostics = [diagnostic];
                        action.isPreferred = true;
                        actions.push(action);
                    }
                    break;
                }
            }
        }
        return actions;
    }
}