import * as vscode from 'vscode';
import { closeDatabaseDiagnostics, initeDatabaseDiagnostics, isDatabaseFileAndPreposed, updateDatabaseDiagnostics } from './database/diagnostics';
import { initeLanguageDiagnostics } from './common/languageDiagnostics';
import { initeColorDecoration, updateColorDecoration } from './common/colorDecoration';
import { initeClothesDiagnostics, isClothesFile, updateClothesDiagnostics } from './clothes/diagnostics';

let diagnosticCollection: vscode.DiagnosticCollection;

export function initeDiagnostics(context: vscode.ExtensionContext) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection('survivalcraft-content-toolkit');
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(document => updateDiagnostics(document)));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => delayUpdateDiagnostics(event)));
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(document => closeDiagnostics(document)));
    context.subscriptions.push(diagnosticCollection);

    initeColorDecoration(context.subscriptions);
    initeLanguageDiagnostics();
    initeDatabaseDiagnostics(diagnosticCollection);
    initeClothesDiagnostics(diagnosticCollection);
}

let timeout: NodeJS.Timeout | undefined = undefined;

function delayUpdateDiagnostics(event: vscode.TextDocumentChangeEvent) {
    if (timeout) {
        clearTimeout(timeout);
    }
    timeout = setTimeout(()=>updateDiagnostics(event.document, event), 500);
}

function updateDiagnostics(document: vscode.TextDocument, event: vscode.TextDocumentChangeEvent | null = null) {
    if (document.languageId === 'xml') {
        updateColorDecoration(document);
        const databaseFlags = isDatabaseFileAndPreposed(document.fileName);
        if(databaseFlags[0]){
            updateDatabaseDiagnostics(document, diagnosticCollection, databaseFlags[1]);
        }else if(isClothesFile(document.fileName)){
            updateClothesDiagnostics(document, diagnosticCollection);
        }
    }
}

function closeDiagnostics(document: vscode.TextDocument) {
    if (document.languageId === 'xml'){
        const databaseFlags = isDatabaseFileAndPreposed(document.fileName);
        if(databaseFlags[0]){
            diagnosticCollection.delete(document.uri);
            closeDatabaseDiagnostics(document.fileName, databaseFlags[1]);
        }
    }
}