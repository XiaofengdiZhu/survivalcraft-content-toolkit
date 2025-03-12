import * as vscode from 'vscode';
import { isCraftingRecipesFile } from './diagnostics';
import { replaceRootElementToMod, setXsd } from '../actions';
import { allLanguages, getPreferedLanguage, languageName2Native } from '../common/languageDiagnostics';

export function initeCraftingRecipesActions(subscriptions: vscode.Disposable[]) {
    subscriptions.push(vscode.languages.registerCodeActionsProvider("xml", new CraftingRecipesActionProvider(), {
        providedCodeActionKinds: CraftingRecipesActionProvider.providedCodeActionKinds
    }));
    subscriptions.push(vscode.languages.registerCompletionItemProvider("xml", new CraftingRecipesCompletionItemProvider(), ".", " ", "\""));
    subscriptions.push(vscode.languages.registerHoverProvider("xml", new CraftingRecipesHoverProvider()));
};

class CraftingRecipesActionProvider implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeAction[]> {
        const actions: vscode.CodeAction[] = [];
        if (!isCraftingRecipesFile(document.fileName)) {
            return actions;
        }
        for (const diagnostic of context.diagnostics) {
            switch (diagnostic.code) {
                case 'xsdNotSet': {
                    const action = setXsd("CraftingRecipes", document, diagnostic);
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

const craftingRecipeTagPattern = /<Recipe.*?>/;
const ingredientPattern = / ([a-z])="(\S+)"/g;
const craftingRecipeRowPattern = /^[ \t]*"([a-z ]*)"$/;

class CraftingRecipesCompletionItemProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        const results: vscode.CompletionItem[] = [];
        if (!isCraftingRecipesFile(document.fileName)) {
            return results;
        }
        const wordRange = document.getWordRangeAtPosition(position, craftingRecipeRowPattern);
        if (!wordRange) {
            return results;
        }
        for (let line = position.line - 1; line > 0; line--) {
            const lineString = document.lineAt(line).text;
            craftingRecipeTagPattern.lastIndex = 0;
            if (craftingRecipeTagPattern.test(lineString)) {
                const ingredients = new Map<string, string>();
                ingredientPattern.lastIndex = 0;
                let match;
                while ((match = ingredientPattern.exec(lineString)) !== null && match.index !== undefined) {
                    ingredients.set(match[1], match[2]);
                }
                if (ingredients.size === 0) {
                    break;
                }
                const wordRange1 = document.getWordRangeAtPosition(position);
                const charsBeforePosition = wordRange1 ? document.getText(wordRange1) : "";
                let baseDescription: string = "";
                if (wordRange1) {
                    for (let i = 0; i < charsBeforePosition.length; i++) {
                        baseDescription = `${baseDescription}${ingredients.get(charsBeforePosition[i]) ?? vscode.l10n.t("notFound")}, `;
                    }
                }
                ingredients.set(" ", " ");
                let index = 1;
                for (const [key, value] of ingredients) {
                    if (key !== " ") {
                        const result = new vscode.CompletionItem({ label: `${wordRange1 ? charsBeforePosition : ""}${key}`, description: `${baseDescription}${value}` }, vscode.CompletionItemKind.Text);
                        result.sortText = index.toString().padStart(6, "0");
                        results.push(result);
                    }
                    let index1 = 1;
                    for (const [key1, value1] of ingredients) {
                        if (key1 !== " ") {
                            const result = new vscode.CompletionItem({ label: `${charsBeforePosition}${key}${key1}`, description: `${baseDescription}${value}, ${value1}` }, vscode.CompletionItemKind.Text);
                            result.sortText = (index * 100 + index1).toString().padStart(6, "0");
                            results.push(result);
                        }
                        let index2 = 1;
                        for (const [key2, value2] of ingredients) {
                            if (key2 !== " ") {
                                const result = new vscode.CompletionItem({ label: `${charsBeforePosition}${key}${key1}${key2}`, description: `${baseDescription}${value}, ${value1}, ${value2}` }, vscode.CompletionItemKind.Text);
                                result.sortText = (index * 10000 + index1 * 100 + index2).toString().padStart(6, "0");
                                results.push(result);
                            }
                            index2++;
                        }
                        index1++;
                    }
                    index++;
                }
                break;
            }
            if (!craftingRecipeRowPattern.test(lineString)) {
                break;
            }
        }
        return results;
    }
}

class CraftingRecipe {
    result?: string;
    resultCount?: number;
    requiredHeatLevel?: number;
    requiredPlayerLevel: number = 1;
    description?: string;
    remains?: string;
    remainsCount?: number;
    ingredients: Map<string, string>;
    pattern: string[];
    maxColumnOfPattern: number = 0;
    constructor(ingredients: Map<string, string> = new Map<string, string>(), pattern: string[] = []) {
        this.ingredients = ingredients;
        this.pattern = pattern;
    }

    toMarkdown(): string | null {
        if (this.pattern.length === 0 || this.maxColumnOfPattern === 0 || this.ingredients.size === 0) {
            return null;
        }
        let markdown = "";
        let resultTranslated: string | undefined;
        if (this.result) {
            const array = this.result.split(":");
            const fullResult = `${array[0]}:${array[1] ?? "0"}`;
            resultTranslated = getPreferedLanguage()?.Blocks?.[fullResult]?.DisplayName;
            if (this.description) {
                if (this.description.startsWith("[") && this.description.endsWith("]")) {
                    let descriptionLines: string[] = [];
                    for (const [name, language] of allLanguages) {
                        descriptionLines.push(`${language.Blocks?.[fullResult]?.[`CRDescription:${this.description.slice(1, -1)}`] ?? vscode.l10n.t("actions.emptyString")} \`${languageName2Native.get(name)}\``);
                    }
                    markdown = `${descriptionLines.join('\n\n')}\n\n`;
                } else {
                    markdown = `${this.description}\n\n`;
                }
            }
        }
        if (this.requiredHeatLevel) {
            markdown += `${vscode.l10n.t("actions.requiredHeatLevel")}: ${this.requiredHeatLevel}\n\n`;
        }
        if (this.requiredPlayerLevel !== 1) {
            markdown += `${vscode.l10n.t("actions.requiredPlayerLevel")}: ${this.requiredPlayerLevel}\n\n`;
        }
        if (markdown.length > 0) {
            markdown += "---\n";
        }
        markdown += `|${"|".repeat(this.maxColumnOfPattern + 3)}\n|${":-:|".repeat(this.maxColumnOfPattern + 3)}`;
        const emptyEndString = "|||";
        const resultString = `⇒|${this.result ? resultTranslated ?? this.result : vscode.l10n.t("diagnostics.notFound")}|×${this.resultCount ?? 0}|`;
        let remainsTranslated: string | undefined;
        if (this.remains) {
            const array = this.remains.split(":");
            remainsTranslated = getPreferedLanguage()?.Blocks?.[`${array[0]}:${array[1] ?? "0"}`]?.DisplayName;
        }
        const remainsString = this.remains ? `|${remainsTranslated ?? this.remains}|×${this.remainsCount ?? 0}|` : emptyEndString;
        for (let row = 0; row < this.pattern.length; row++) {
            markdown += "\n|\\|";
            const rowString = this.pattern[row];
            for (let i = 0; i < rowString.length; i++) {
                const char = rowString[i];
                markdown += ` ${char === " " ? "□" : this.ingredients.get(char) ?? "∅"} \\||`;
            }
            const emptyLength = this.maxColumnOfPattern - rowString.length;
            if (emptyLength > 0) {
                markdown += " □ \\||".repeat(emptyLength);
            }
            if (this.pattern.length <= 2) {
                if (row === 0) {
                    markdown += resultString;
                } else if (row === 1) {
                    markdown += remainsString;
                }
            }
            switch (row) {
                case 0:
                    markdown += this.pattern.length <= 2 ? this.remains ? resultString : emptyEndString : emptyEndString;
                    break;
                case 1:
                    markdown += this.pattern.length <= 2 ? this.remains ? remainsString : resultString : resultString;
                    break;
                case 2:
                    markdown += this.pattern.length <= 2 ? emptyEndString : remainsString;
                    break;
                default:
                    markdown += emptyLength;
            }
        }
        if (this.pattern.length === 1 && this.remains) {
            markdown += `\n|${"|".repeat(this.maxColumnOfPattern)}${remainsString}`;
        }
        return markdown;
    }
}

class CraftingRecipesHoverProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
        if (!isCraftingRecipesFile(document.fileName)) {
            return null;
        }
        const wordRange = document.getWordRangeAtPosition(position, craftingRecipeRowPattern);
        if (!wordRange) {
            return null;
        }
        let craftingRecipe = new CraftingRecipe();
        let match: RegExpMatchArray | null;
        for (let line = position.line - 1; line > 0; line--) {
            const lineString = document.lineAt(line).text;
            if ((match = craftingRecipeRowPattern.exec(lineString)) !== null && match.index !== undefined) {
                craftingRecipe.pattern.unshift(match[1]);
                craftingRecipe.maxColumnOfPattern = Math.max(craftingRecipe.maxColumnOfPattern, match[1].length);
            } else {
                if (craftingRecipeTagPattern.test(lineString)) {
                    let result = lineString.match(/ Result="(\S+)"/)?.[1];
                    if (result) {
                        craftingRecipe.result = result;
                        let description = lineString.match(/ Description="(.+)"/)?.[1];
                        if (description) {
                            craftingRecipe.description = description;
                        }
                    }
                    let resultCount = lineString.match(/ ResultCount="(\d+)"/)?.[1];
                    if (resultCount) {
                        craftingRecipe.resultCount = parseInt(resultCount);
                    }
                    let requiredHeatLevel = lineString.match(/ RequiredHeatLevel="(\d+)"/)?.[1];
                    if (requiredHeatLevel) {
                        craftingRecipe.requiredHeatLevel = parseInt(requiredHeatLevel);
                    }
                    let requiredPlayerLevel = lineString.match(/ RequiredPlayerLevel="([\d\.]+)"/)?.[1];
                    if (requiredPlayerLevel) {
                        craftingRecipe.requiredPlayerLevel = parseFloat(requiredPlayerLevel);
                    }
                    let remains = lineString.match(/ Remains="(\S+)"/)?.[1];
                    if (remains) {
                        craftingRecipe.remains = remains;
                        let remainsCount = lineString.match(/ RemainsCount="(\d+)"/)?.[1];
                        if (remainsCount) {
                            craftingRecipe.remainsCount = parseInt(remainsCount);
                        }
                    }
                    ingredientPattern.lastIndex = 0;
                    while ((match = ingredientPattern.exec(lineString)) !== null && match.index !== undefined) {
                        craftingRecipe.ingredients.set(match[1], match[2]);
                    }
                    if (craftingRecipe.ingredients.size === 0) {
                        return null;
                    }
                    break;
                } else {
                    return null;
                }
            }
        }
        for (let line = position.line; line < document.lineCount; line++) {
            const lineString = document.lineAt(line).text;
            if ((match = craftingRecipeRowPattern.exec(lineString)) !== null && match.index !== undefined) {
                craftingRecipe.pattern.push(match[1]);
                craftingRecipe.maxColumnOfPattern = Math.max(craftingRecipe.maxColumnOfPattern, match[1].length);
            } else {
                break;
            }
        }
        const markdown = craftingRecipe.toMarkdown();
        if (markdown) {
            return new vscode.Hover(new vscode.MarkdownString(markdown));
        }
        return null;
    }
}