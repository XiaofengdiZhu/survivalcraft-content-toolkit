import * as vscode from 'vscode';

let activeEditor: vscode.TextEditor | undefined;
export function initeColorDecoration(subscriptions: vscode.Disposable[]) {
    subscriptions.push(vscode.languages.registerColorProvider('xml', new ColorProvider()));
}

const colorPattern = /(?<=Color=)" ?(\d{1,3}), ?(\d{1,3}), ?(\d{1,3})(?:, ?(\d{1,3}))?"/g;

class ColorProvider implements vscode.DocumentColorProvider {
    provideDocumentColors(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.ColorInformation[]> {
        const colors: vscode.ColorInformation[] = [];
        const text = document.getText();
        let match;
        while ((match = colorPattern.exec(text)) !== null) {
            if (match[1] && match[2] && match[3]) {
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[0].length);
                const color = new vscode.Color(Number(match[1]) / 255, Number(match[2]) / 255, Number(match[3]) / 255, match[4] ? Number(match[4]) / 255 : 1);
                colors.push(new vscode.ColorInformation(new vscode.Range(startPos, endPos), color));
            }
        }
        return colors;
    }
    provideColorPresentations(color: vscode.Color, context: { document: vscode.TextDocument, range: vscode.Range }, token: vscode.CancellationToken): vscode.ProviderResult<vscode.ColorPresentation[]> {
        return [new vscode.ColorPresentation(`"${Math.round(color.red * 255)}, ${Math.round(color.green * 255)}, ${Math.round(color.blue * 255)}${color.alpha === 1 ? '' : ', ' + Math.round(color.alpha * 255)}"`)];
    }
}