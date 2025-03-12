import * as vscode from 'vscode';

export function initeCraftingRecipesDiagnostics(diagnosticCollection: vscode.DiagnosticCollection) {
    vscode.workspace.textDocuments.forEach(document => {
        if (isCraftingRecipesFile(document.fileName)) {
            updateCraftingRecipesDiagnostics(document, diagnosticCollection);
        }
    });
}

export function isCraftingRecipesFile(fileName: string) {
    return fileName.toLowerCase().endsWith(".cr") || fileName.endsWith("CraftingRecipes.xml");
}

const rootTagPattern = /<\w+.*?>/;
const craftingRecipeTagPattern = /<Recipe.*?>/g;
const ingredientPattern = / ([a-z])="\S+"/g;
const craftingRecipeRowPattern = /^([ \t]*")([a-z ]*)"$/;

export function updateCraftingRecipesDiagnostics(document: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection) {
    const text = document.getText();
    const diagnostics: vscode.Diagnostic[] = [];
    let match: RegExpMatchArray | null;

    if (document.fileName.toLowerCase().endsWith('.cr') && !text.includes('xsi:noNamespaceSchemaLocation')) {
        rootTagPattern.lastIndex = 0;
        if ((match = rootTagPattern.exec(text)) !== null && match.index !== undefined) {
            const rootElement = match[0];
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + rootElement.length);
            const range = new vscode.Range(startPos, endPos);

            const diagnostic = new vscode.Diagnostic(
                range,
                vscode.l10n.t("diagnostics.xsdNotSet"),
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.code = 'xsdNotSet';
            diagnostic.source = 'survivalcraft-content-toolkit';

            diagnostics.push(diagnostic);
        }
    }
    craftingRecipeTagPattern.lastIndex = 0;
    while ((match = craftingRecipeTagPattern.exec(text)) !== null && match.index !== undefined) {
        let line = document.positionAt(match.index).line;
        const ingredients: string[] = [];
        const tag = match[0];
        while ((match = ingredientPattern.exec(tag)) !== null && match.index !== undefined) {
            ingredients.push(match[1]);
        }
        while (++line < document.lineCount) {
            const lineString = document.lineAt(line).text;
            if ((match = craftingRecipeRowPattern.exec(lineString)) !== null && match.index !== undefined) {
                const lengthBeforeChars = match[1].length;
                const chars = match[2];
                for (let i = 0; i < chars.length; i++) {
                    const char = chars[i];
                    const code = char.charCodeAt(0);
                    if (code >= 97 && code <= 122 && !ingredients.includes(char)) {
                        const diagnostic = new vscode.Diagnostic(
                            new vscode.Range(line, lengthBeforeChars + i, line, lengthBeforeChars + i + 1),
                            vscode.l10n.t("diagnostics.ingredientNotSet", char),
                            vscode.DiagnosticSeverity.Error
                        );
                        diagnostic.code = 'ingredientNotSet';
                        diagnostic.source = 'survivalcraft-content-toolkit';
                        diagnostics.push(diagnostic);
                    }
                }
            }
            else {
                break;
            }
        }
    }

    diagnosticCollection.set(document.uri, diagnostics);
}