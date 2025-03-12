import * as vscode from 'vscode';
import * as fs from 'fs';

class Language {
    languageName: string;
    content: any;
    constructor(languageName: string, content: any) {
        this.languageName = languageName;
        this.content = content;
    }
}

export const languageFileWatchers = new Map<string, fs.FSWatcher>();
const originalLanguageFiles = new Map<string, Language>();
export const allLanguages = new Map<string, any>();
export const languageName2Native = new Map<string, string>();

export function initeLanguageDiagnostics() {
    const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
    const preposedLanguageFiles: string[] = config.get('preposedLanguageFiles') ?? [];

    if (preposedLanguageFiles.length > 0) {
        for (const file of preposedLanguageFiles) {
            readAndWatchLanguageFile(file);
        }
    }
}

export function updateLanguageDiagnostics(fileName: string, content: string) {
    let originalJson;
    try {
        originalJson = JSON.parse(content.replace(/^\uFEFF/, ''));
    }
    catch (e) {
        const err = e as Error;
        vscode.window.showErrorMessage(vscode.l10n.t("diagnostics.cannotLoadPreLanguage", fileName, err.message));
        return;
    }
    const languageName = removeStringsFromLanguageFile(fileName);
    originalLanguageFiles.set(fileName, new Language(languageName, originalJson));
    let result: any = {};
    for (const [fsPath, language] of originalLanguageFiles) {
        if (language.languageName === languageName) {
            result = Object.assign(result, language.content);
        }
    }
    const nativeName = result["Language"]?.["Name"];
    if (nativeName) {
        languageName2Native.set(languageName, nativeName);
        allLanguages.set(languageName, result);
    }
    else {
        vscode.window.showErrorMessage(vscode.l10n.t("diagnostics.noNativeLanguageName", languageName));
    }
}

export function isLanguageFileAndPreposed(fileName: string) {
    if (!isLanguageFile(fileName)) {
        return [false, false];
    }
    const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
    const preposedLanguageFiles: string[] = config.get('preposedLanguageFiles') ?? [];
    const isPreposed = preposedLanguageFiles.includes(fileName);
    return [true, isPreposed];
}

export function isLanguageFile(fileName: string) {
    return fileName.toLowerCase().endsWith(".json");
}

function removeStringsFromLanguageFile(fsPath: string) {
    originalLanguageFiles.delete(fsPath);
    const languageName = (fsPath.split('\\').pop() || fsPath.split('/').pop())?.toLowerCase().replace('.json', '') || 'en-us';
    allLanguages.delete(languageName);
    return languageName;
}

export function closeLanguageDiagnostics(fsPath: string, isPreposedDatabaseFile: boolean) {
    if (!isPreposedDatabaseFile) {
        languageFileWatchers.get(fsPath)?.close();
        languageFileWatchers.delete(fsPath);
        removeStringsFromLanguageFile(fsPath);
    }
}

export function readAndWatchLanguageFile(fsPath: string) {
    fs.readFile(fsPath, (err, data) => {
        if (err) {
            vscode.window.showErrorMessage(vscode.l10n.t("diagnostics.cannotLoadPreLanguage", fsPath, err.message));
            return;
        }
        languageFileWatchers.set(fsPath, fs.watch(fsPath, (event, filename) => {
            if (event === "change") {
                fs.readFile(fsPath, (err, data) => {
                    if (err) {
                        vscode.window.showErrorMessage(vscode.l10n.t("diagnostics.cannotLoadPreLanguage", fsPath, err.message));
                        return;
                    }
                    updateLanguageDiagnostics(fsPath, data.toString("utf-8"));
                });
            }
        }));
        updateLanguageDiagnostics(fsPath, data.toString("utf-8"));
    });
}
export function getPreferedLanguage(): any {
    const vscodeLanguage = vscode.env.language.toLowerCase();
    let enUs;
    for (const [key, value] of allLanguages) {
        const keyLowerCase = key.toLowerCase();
        if (keyLowerCase === vscodeLanguage) {
            return value;
        } else if (keyLowerCase === "en-us") {
            enUs = value;
        }
    }
    return enUs ?? null;
}