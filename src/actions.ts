import * as vscode from 'vscode';
import { initeCommonActions } from './common/actions';
import { initeDatabaseActions } from './database/actions';
import { initeClothesActions } from './clothes/actions';
import { initeCraftingRecipesActions } from './craftingrecipes/actions';

export function initeActions(context: vscode.ExtensionContext) {
    initeCommonActions(context.subscriptions);
    initeDatabaseActions(context.subscriptions);
    initeClothesActions(context.subscriptions);
    initeCraftingRecipesActions(context.subscriptions);
}

export function setXsd(name: string, document: vscode.TextDocument, diagnostic: vscode.Diagnostic) {
    const oldStartTag = document.getText(diagnostic.range);
    const match = oldStartTag.match(/<\w+/);
    if (match) {
        const action = new vscode.CodeAction(vscode.l10n.t("actions.setXsd", name), vscode.CodeActionKind.QuickFix);
        action.edit = new vscode.WorkspaceEdit();
        const xmlnsXsi = ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        const href = config.get(`default${name}XsdPath`) ?? `https://gitee.com/SC-SPM/SurvivalcraftApi/raw/SCAPI1.8/Survivalcraft/Content/Assets/${name}.xsd`;
        action.edit.insert(document.uri, diagnostic.range.start.translate(0, match[0].length), `${oldStartTag.includes(xmlnsXsi) ? '' : xmlnsXsi} xsi:noNamespaceSchemaLocation="${href}"`);
        action.diagnostics = [diagnostic];
        action.isPreferred = true;
        return action;
    }
    return null;
}

export function replaceRootElementToMod(document: vscode.TextDocument, diagnostic: vscode.Diagnostic) {
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
    return action;
}