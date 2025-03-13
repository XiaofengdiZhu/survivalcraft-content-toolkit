import * as vscode from 'vscode';
import { allLanguages, languageName2Native } from './languageDiagnostics';
import { isDatabaseFileAndPreposed } from '../database/diagnostics';
import { isClothesFile } from '../clothes/diagnostics';
import { isCraftingRecipesFile } from '../craftingrecipes/diagnostics';
import { craftingId2ClassName } from '../blocksdata/diagnostics';

const languageAttributePattern = /(\w+)="\[([^\s:]+)(?::(\d+))?\]"/;
const craftingRecipeTagPattern = /<Recipe .*?Result="([^\s:]+)(?::(\d+))?" .*?Description="\[(\d+)\]"/;
const craftingRecipeAttributePattern = /(?! )(Result|Remains|[a-z])="([^\s:]+)(?::(\d+))?"/;

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
        if (isCraftingRecipesFile(document.fileName)) {
            const wordRange = document.getWordRangeAtPosition(position, craftingRecipeAttributePattern);
            if (wordRange) {
                const match = document.getText(wordRange).match(craftingRecipeAttributePattern);
                if (match !== null && match.index !== undefined) {
                    const info1 = match[1];
                    const info2 = match[2];
                    const info3 = match[3];
                    const lines: string[] = [];
                    const emptyString = vscode.l10n.t("actions.emptyString");
                    for (const [name, language] of allLanguages) {
                        let string: string | undefined;
                        if (info1.length === 1) {
                            const ingredientClassName = craftingId2ClassName.get(info2);
                            if (ingredientClassName) {
                                const fullIngredient = `${ingredientClassName}:${info3 ?? "0"}`;
                                string = language.Blocks?.[fullIngredient]?.DisplayName;
                            }
                        } else {
                            string = language.Blocks?.[`${info2}:${info3 ?? "0"}`]?.DisplayName;
                        }
                        if (typeof (string) === "string") {
                            lines.push(`${string.length > 0 ? string : emptyString} \`${languageName2Native.get(name)}\``);
                        }
                    }
                    if (lines.length > 0) {
                        return Promise.resolve(new vscode.Hover(new vscode.MarkdownString(lines.join('\n\n')), wordRange));
                    }
                }
                return null;
            }
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
            const emptyString = vscode.l10n.t("actions.emptyString");
            for (const [name, language] of allLanguages) {
                let string: string | undefined;
                const databaseFlags = isDatabaseFileAndPreposed(document.fileName);
                if (databaseFlags[0]) {
                    if (info2) {
                        string = language["Database"]?.[info1]?.[info2];
                    }
                } else if (isClothesFile(document.fileName)) {
                    if (info2) {
                        string = language.Blocks?.[`${info1}:${info2}`]?.[attributeName];
                    }
                } else if (isCraftingRecipesFile(document.fileName)) {
                    const wordRange1 = document.getWordRangeAtPosition(position, craftingRecipeTagPattern);
                    if (wordRange1) {
                        const match1 = document.getText(wordRange1).match(craftingRecipeTagPattern);
                        if (match1 && match1[1] && match1[3]) {
                            string = language.Blocks?.[`${match1[1]}:${match1[2] ?? "0"}`]?.[`CRDescription:${match1[3]}`];
                        }
                    }
                }
                else {
                    if (info2) {
                        string = language["ContentWidgets"]?.[info1]?.[info2];
                    }
                }
                if (typeof (string) === "string") {
                    lines.push(`${string.length > 0 ? string : emptyString} \`${languageName2Native.get(name)}\``);
                }
            }
            if (lines.length > 0) {
                return Promise.resolve(new vscode.Hover(new vscode.MarkdownString(lines.join('\n\n')), wordRange));
            }
        }
    }
}