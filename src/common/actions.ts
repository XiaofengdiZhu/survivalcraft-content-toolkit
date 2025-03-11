import * as vscode from 'vscode';
import { allLanguages, languageName2Native } from './languageDiagnostics';
import { isDatabaseFileAndPreposed } from '../database/diagnostics';
import { isClothesFile } from '../clothes/diagnostics';
import { isCraftingRecipesFile } from '../craftingrecipes/diagnostics';

const languageAttributePattern = /(\w+)="\[([\w\.]+)(?::(\w+))?\]"/;
const craftingRecipePattern = /<Recipe .*?Result="(\w+)(?::(\w+))?" .*?Description="\[(\w+)\]"/;

export function initeCommonActions(subscriptions: vscode.Disposable[]) {
    subscriptions.push(vscode.languages.registerHoverProvider('xml', new LanguageHoverProvider()));
}

class LanguageHoverProvider implements vscode.HoverProvider {
    public provideHover(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):
        vscode.ProviderResult<vscode.Hover> {
        if (document.languageId !== 'xml' || allLanguages.size === 0) {
            return null;
        }
        const wordRange = document.getWordRangeAtPosition(position, languageAttributePattern);
        if (!wordRange) {
            return null;
        }
        const match = document.getText(wordRange).match(languageAttributePattern);
        if (match && match[1] && match[2]) {
            const attributeName = match[1];
            const info1 = match[2];
            const info2 = match[3];
            const lines: string[] = [];
            for (const [name, language] of allLanguages) {
                let string;
                const databaseFlags = isDatabaseFileAndPreposed(document.fileName);
                if (databaseFlags[0]) {
                    if (info2) {
                        string = language["Database"]?.[info1]?.[info2];
                    }
                } else if (isClothesFile(document.fileName)) {
                    if (info2) {
                        string = language["Blocks"]?.[`${info1}:${info2}`]?.[attributeName];
                    }
                } else if (isCraftingRecipesFile(document.fileName)) {
                    const wordRange1 = document.getWordRangeAtPosition(position, craftingRecipePattern);
                    if (wordRange1) {
                        const match1 = document.getText(wordRange1).match(craftingRecipePattern);
                        if (match1 && match1[1] && match1[3]) {
                            const num = match1[2];
                            string = language["Blocks"]?.[`${match1[1]}:${num ?? "0"}`]?.[`CRDescription:${match1[3]}`];
                        }
                    }
                }
                else {
                    if (info2) {
                        string = language["ContentWidgets"]?.[info1]?.[info2];
                    }
                }
                if (string) {
                    lines.push(`${string.length > 0 ? string : vscode.l10n.t("actions.emptyString")} \`${languageName2Native.get(name)}\``);
                }
            }
            if (lines.length > 0) {
                return Promise.resolve(new vscode.Hover(new vscode.MarkdownString(lines.join('\n\n')), new vscode.Range(new vscode.Position(wordRange.start.line, wordRange.start.character + match[1].length), wordRange.end)));
            }
        }
    }
}