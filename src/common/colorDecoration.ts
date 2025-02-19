import * as vscode from 'vscode';

let activeEditor: vscode.TextEditor | undefined;
export function initeColorDecoration(subscriptions: vscode.Disposable[]) {
    subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor && editor.document.languageId === 'xml') {
            setTimeout(() => updateColorDecoration(editor.document), 500);
        }
    }));
    activeEditor = vscode.window.activeTextEditor;
    setTimeout(() => vscode.workspace.textDocuments.forEach(document => {
        if (document.languageId === 'xml') {
            updateColorDecoration(document);
        }
    }), 500);
}

const colorPattern = /(?<=Color=)" ?(\d{1,3}), ?(\d{1,3}), ?(\d{1,3})(?:, ?(\d{1,3}))?"/g;

const colorDecorationType = vscode.window.createTextEditorDecorationType({
    before: {
        contentText: ' ',
        backgroundColor: '',
        width: '0.75em',
        height: '0.75em',
        border: '1px solid gray',
    },
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
});

export function updateColorDecoration(document: vscode.TextDocument) {
    if (!activeEditor || document !== activeEditor.document) {
        return;
    }
    const text = activeEditor.document.getText();
    const decorations: vscode.DecorationOptions[] = [];

    let match;
    while ((match = colorPattern.exec(text)) !== null) {
        if (match[1] && match[2] && match[3]) {
            const startPos = activeEditor.document.positionAt(match.index);
            const endPos = activeEditor.document.positionAt(match.index + match[0].length);
            const decoration = { range: new vscode.Range(startPos, endPos), renderOptions: { before: { backgroundColor: `rgba(${match[1]},${match[2]},${match[3]},${match[4] ? Number(match[4]) / 255 : 1})` } } };
            decorations.push(decoration);
        }
    }

    activeEditor.setDecorations(colorDecorationType, decorations);
}