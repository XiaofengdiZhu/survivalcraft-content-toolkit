import * as vscode from 'vscode';
import * as fs from 'fs';

export const blocksDataFileWatchers = new Map<string, fs.FSWatcher>();
const originalBlocksDataFiles = new Map<string, Map<string, string>>();
export let craftingId2ClassName = new Map<string, string>();

export function initeBlocksDataDiagnostics() {
    const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
    const preposedBlocksDataFiles: string[] = config.get('preposedBlocksDataFiles') ?? [];

    if (preposedBlocksDataFiles.length > 0) {
        for (const file of preposedBlocksDataFiles) {
            readAndWatchBlocksDataFile(file);
        }
    }
}

export function updateBlocksDataDiagnostics(fileName: string, content: string) {
    originalBlocksDataFiles.delete(fileName);
    const rows = content.split("\n");
    let classNameIndex: number | undefined;
    let craftingIdIndex: number | undefined;
    const map = new Map<string, string>();
    for (let i = 0; i < rows.length; i++) {
        const columns = rows[i].split(";");
        if (i === 0) {
            for (let j = 0; j < columns.length; j++) {
                const column = columns[j];
                if (column === "Class Name") {
                    classNameIndex = j;
                } else if (column === "CraftingId") {
                    craftingIdIndex = j;
                }
            }
            if (typeof classNameIndex === "undefined" || typeof craftingIdIndex === "undefined") {
                vscode.window.showErrorMessage(vscode.l10n.t("diagnostics.cannotLoadPreBlocksData", fileName, vscode.l10n.t("main.invalid")));
                return;
            }
            continue;
        }
        const className = columns[classNameIndex ?? 0] ?? "";
        const craftingId = columns[craftingIdIndex ?? 14] ?? "";
        if (className.length > 0 && craftingId.length > 0) {
            map.set(craftingId, className);
        }
    }
    originalBlocksDataFiles.set(fileName, map);
    let result = new Map<string, string>();
    for (const [_fsPath, blocksData] of originalBlocksDataFiles) {
        for (const [craftingId, className] of blocksData) {
            result.set(craftingId, className);
        }
    }
    craftingId2ClassName = result;
}

export function isBlocksDataFileAndPreposed(fileName: string) {
    if (!isBlocksDataFile(fileName)) {
        return [false, false];
    }
    const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
    const preposedBlocksDataFiles: string[] = config.get('preposedBlocksDataFiles') ?? [];
    const isPreposed = preposedBlocksDataFiles.includes(fileName);
    return [true, isPreposed];
}

export function isBlocksDataFile(fileName: string) {
    return fileName.toLowerCase().endsWith(".csv") || fileName.endsWith("BlocksData.txt");
}

export function closeBlocksDataDiagnostics(fsPath: string, isPreposedDatabaseFile: boolean) {
    if (!isPreposedDatabaseFile) {
        blocksDataFileWatchers.get(fsPath)?.close();
        blocksDataFileWatchers.delete(fsPath);
        originalBlocksDataFiles.delete(fsPath);
    }
}

export function readAndWatchBlocksDataFile(fsPath: string) {
    fs.readFile(fsPath, (err, data) => {
        if (err) {
            vscode.window.showErrorMessage(vscode.l10n.t("diagnostics.cannotLoadPreBlocksData", fsPath, err.message));
            return;
        }
        blocksDataFileWatchers.set(fsPath, fs.watch(fsPath, (event, filename) => {
            if (event === "change") {
                fs.readFile(fsPath, (err, data) => {
                    if (err) {
                        vscode.window.showErrorMessage(vscode.l10n.t("diagnostics.cannotLoadPreBlocksData", fsPath, err.message));
                        return;
                    }
                    updateBlocksDataDiagnostics(fsPath, data.toString("utf-8"));
                });
            }
        }));
        updateBlocksDataDiagnostics(fsPath, data.toString("utf-8"));
    });
}