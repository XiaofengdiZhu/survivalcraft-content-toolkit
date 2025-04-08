import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { closeLanguageDiagnostics, isLanguageFileAndPreposed, readAndWatchLanguageFile } from './languageDiagnostics';
import { isBlocksDataFileAndPreposed } from '../blocksdata/diagnostics';
import { addToPreBlocksDataFiles } from '../blocksdata/commands';
import { isDatabaseFileAndPreposed } from '../database/diagnostics';
import { addToPreDatabaseFiles } from '../database/commands';

export function initeCommonCommands(subscriptions: vscode.Disposable[]) {
    const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
    let languageFiles: string[] = config.get('preposedLanguageFiles') ?? [];
    vscode.commands.executeCommand('setContext', 'sct.preposedLanguageFiles', languageFiles);
    let contentDirectories: string[] = config.get('contentDirectories') ?? [];
    vscode.commands.executeCommand('setContext', 'sct.contentDirectories', contentDirectories);
    subscriptions.push(vscode.commands.registerCommand('survivalcraft-content-toolkit.addToPreLanguageFiles', addToPrePreLanguageFiles));
    subscriptions.push(vscode.commands.registerCommand('survivalcraft-content-toolkit.removeFromPreLanguageFiles', removeFromPrePreLanguageFiles));
    subscriptions.push(vscode.commands.registerCommand('survivalcraft-content-toolkit.addToContentDirectories', addToContentDirectories));
    subscriptions.push(vscode.commands.registerCommand('survivalcraft-content-toolkit.removeFromContentDirectories', removeFromContentDirectories));
    subscriptions.push(vscode.commands.registerCommand('survivalcraft-content-toolkit.openFile', openFile));
    if (contentDirectories.length === 0) {
        vscode.workspace.findFiles("{BlocksData.txt,Database.xml,*.xdb,*.cr,*.clo}").then(uris => {
            const fromWorkspace = vscode.l10n.t("main.fromWorkspace");
            const fromOtherDirectory = vscode.l10n.t("main.fromOtherDirectory");
            const cancel = vscode.l10n.t("main.cancel");
            const resultHandler = (result: string | undefined) => {
                switch (result) {
                    case fromWorkspace:
                        vscode.window.showWorkspaceFolderPick({ placeHolder: vscode.l10n.t("commands.pickWorkspaceFolderToContentDirectories") }).then(folder => {
                            if (folder) {
                                addToContentDirectories(folder.uri);
                            } else {
                                vscode.window.showWarningMessage(vscode.l10n.t("commands.pickToContentDirectoriesCanceled"));
                            }
                        });
                        break;
                    case fromOtherDirectory:
                        vscode.window.showOpenDialog({ canSelectFolders: true, title: vscode.l10n.t("commands.pickOtherDirectoryToContentDirectories") }).then(uris => {
                            if (uris) {
                                addToContentDirectories(uris[0]);
                            } else {
                                vscode.window.showWarningMessage(vscode.l10n.t("commands.pickToContentDirectoriesCanceled"));
                            }
                        });
                        break;
                    case cancel:
                        vscode.window.showWarningMessage(vscode.l10n.t("commands.pickToContentDirectoriesCanceled"));
                        break;
                }
            };
            if (uris.length > 0) {
                vscode.window.showWarningMessage(vscode.l10n.t("commands.noItemInContentDirectories"), fromWorkspace, fromOtherDirectory, cancel).then(resultHandler);
            } else {
                vscode.window.showWarningMessage(vscode.l10n.t("commands.noItemInContentDirectories"), fromOtherDirectory, cancel).then(resultHandler);
            }
        });
    }
}

function addToPrePreLanguageFiles(uri: any, noWarning: boolean = false) {
    if (uri?.fsPath) {
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        let files: string[] = config.get('preposedLanguageFiles') ?? [];
        if (files) {
            if (files.includes(uri.fsPath)) {
                if (!noWarning) {
                    vscode.window.showWarningMessage(vscode.l10n.t("messages.alreadyInPreFiles", vscode.l10n.t("main.language")));
                }
            } else {
                files.push(uri.fsPath);
                config.update('preposedLanguageFiles', files, vscode.ConfigurationTarget.Global);
                vscode.commands.executeCommand('setContext', 'sct.preposedLanguageFiles', files);
                vscode.window.showInformationMessage(vscode.l10n.t("messages.addedToPreFiles", vscode.l10n.t("main.language")));
                readAndWatchLanguageFile(uri.fsPath);
            }
        }
    }
}

function removeFromPrePreLanguageFiles(uri: any) {
    if (uri?.fsPath) {
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        let files: string[] = config.get('preposedLanguageFiles') ?? [];
        if (files && files.includes(uri.fsPath)) {
            files = files.filter(file => file !== uri.fsPath);
            config.update('preposedLanguageFiles', files, vscode.ConfigurationTarget.Global);
            vscode.commands.executeCommand('setContext', 'sct.preposedLanguageFiles', files);
            vscode.window.showInformationMessage(vscode.l10n.t("messages.removedFromPreFiles", vscode.l10n.t("main.language")));
            closeLanguageDiagnostics(uri.fsPath, false);
        }
    }
}

function addToContentDirectories(uri: any) {
    if (uri?.fsPath) {
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        let directories: string[] = config.get('contentDirectories') ?? [];
        if (directories) {
            if (directories.includes(uri.fsPath)) {
                vscode.window.showWarningMessage(vscode.l10n.t("messages.alreadyInContentDirectories"));
            } else {
                directories.push(uri.fsPath);
                config.update('contentDirectories', directories, vscode.ConfigurationTarget.Global);
                vscode.commands.executeCommand('setContext', 'sct.contentDirectories', directories);
                vscode.window.showInformationMessage(vscode.l10n.t("messages.addedToContentDirectories"));
                scanContentDirectories(uri.fsPath);
            }
        }
    }
}

function removeFromContentDirectories(uri: any) {
    if (uri?.fsPath) {
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        let directories: string[] = config.get('contentDirectories') ?? [];
        if (directories && directories.includes(uri.fsPath)) {
            directories = directories.filter(directory => directory !== uri.fsPath);
            config.update('contentDirectories', directories, vscode.ConfigurationTarget.Global);
            vscode.commands.executeCommand('setContext', 'sct.contentDirectories', directories);
            vscode.window.showInformationMessage(vscode.l10n.t("messages.removedFromContentDirectories"));
        }
    }
}

function scanContentDirectories(fsPath: string) {
    fs.readdir(fsPath, (err, dir) => {
        if (err) {
            vscode.window.showErrorMessage(vscode.l10n.t("messages.cannotLoadDirectory", fsPath, err.message));
            return;
        }
        for (const file of dir) {
            const fullPath = path.join(fsPath, file);
            const blocksDataFlags = isBlocksDataFileAndPreposed(fullPath);
            if (blocksDataFlags[0] && !blocksDataFlags[1]) {
                addToPreBlocksDataFiles({ fsPath: fullPath }, true);
                continue;
            }
            const databaseFlags = isDatabaseFileAndPreposed(fullPath);
            if (databaseFlags[0] && !databaseFlags[1]) {
                addToPreDatabaseFiles({ fsPath: fullPath }, true);
                continue;
            }
            if (file === "Lang") {
                fs.readdir(fullPath, (err, languageDir) => {
                    if (err) {
                        return;
                    }
                    languageDir.forEach((languageFile) => {
                        const fullLanguagePath = path.join(fullPath, languageFile);
                        const languageFlags = isLanguageFileAndPreposed(fullLanguagePath);
                        if (languageFlags[0] && !languageFlags[1]) {
                            addToPrePreLanguageFiles({ fsPath: fullLanguagePath }, true);
                        }
                    });
                });
            }
        }
    });
}

function openFile(formatedUri: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
    vscode.workspace.openTextDocument(vscode.Uri.parse(formatedUri)).then(document => {
        vscode.window.showTextDocument(document, {
            selection: new vscode.Range(new vscode.Position(startLine, startCharacter), new vscode.Position(endLine, endCharacter))
        });
    });
}