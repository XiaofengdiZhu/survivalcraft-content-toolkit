import * as vscode from 'vscode';

export function initeClothesDiagnostics(diagnosticCollection: vscode.DiagnosticCollection) {
    vscode.workspace.textDocuments.forEach(document => {
        if (isClothesFile(document.fileName)) {
            updateClothesDiagnostics(document, diagnosticCollection);
        }
    });
}

export function isClothesFile(fileName: string) {
    return fileName.toLowerCase().endsWith(".clo") || fileName.endsWith("Clothes.xml");
}

const rootTagPattern = /<\w+.*?>/;

export function updateClothesDiagnostics(document: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection) {
    const text = document.getText();
    const diagnostics: vscode.Diagnostic[] = [];
    let match: RegExpMatchArray | null;

    if (document.fileName.toLowerCase().endsWith('.clo') && !text.includes('xsi:noNamespaceSchemaLocation')) {
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

    diagnosticCollection.set(document.uri, diagnostics);
}