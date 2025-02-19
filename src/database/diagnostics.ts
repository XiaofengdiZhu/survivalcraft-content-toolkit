import * as vscode from 'vscode';

export class TagInfo {
    tagName: string;
    uri: vscode.Uri;
    range: vscode.Range;
    name: string | null;
    constructor(tagName: string, uri: vscode.Uri, range: vscode.Range, name: string | null) {
        this.tagName = tagName;
        this.uri = uri;
        this.range = range;
        this.name = name;
    }
}

export const allTagsWithGuid: Map<string, TagInfo[]> = new Map();
export const allTagsWithInheritanceParent: Map<string, TagInfo[]> = new Map();
const openedPreposedDatabaseFiles: string[] = [];

export function initeDatabaseDiagnostics(diagnosticCollection: vscode.DiagnosticCollection) {
    const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
    const preposedDatabaseFiles: string[] = config.get('preposedDatabaseFiles') ?? [];

    if (preposedDatabaseFiles.length > 0) {
        let count = 0;
        for (const file of preposedDatabaseFiles) {
            vscode.workspace.openTextDocument(vscode.Uri.file(file)).then(document => {
                if (++count === preposedDatabaseFiles.length) {
                    vscode.workspace.textDocuments.forEach(document => {
                        if (isDatabaseFile(document.fileName) && !openedPreposedDatabaseFiles.includes(document.fileName)) {
                            updateDatabaseDiagnostics(document, diagnosticCollection, preposedDatabaseFiles.includes(document.fileName));
                        }
                    });
                }
            }, error => {
                vscode.window.showErrorMessage(vscode.l10n.t("diagnostics.cannotLoadPreDatabase", file, error));
            });
        }
    } else {
        vscode.workspace.textDocuments.forEach(document => {
            if (isDatabaseFile(document.fileName)) {
                updateDatabaseDiagnostics(document, diagnosticCollection, false);
            }
        });
    }
}

export function isDatabaseFileAndPreposed(fileName: string) {
    const flag = isDatabaseFile(fileName);
    const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
    const preposedDatabaseFiles: string[] = config.get('preposedDatabaseFiles') ?? [];
    const isPreposed = preposedDatabaseFiles.includes(fileName);
    return [flag || isPreposed, isPreposed];
}

export function isDatabaseFile(fileName: string) {
    return fileName.toLowerCase().endsWith(".xdb") || fileName.endsWith("Database.xml");
}

const rootTagPattern = /<\w+.*?>/;
const tagWithGuidPattern = /<(\w+).*?Guid="([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})".*?>/g;
const inheritanceParentPattern = /<(\w+).*?InheritanceParent="([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})"/g;
const lowLevelTagNames = ["Parameter", "ParameterSet", "MemberComponentTemplate"];
const allowedInheritanceParents: { [key: string]: string[] } = {
    "Folder": [],
    "ProjectTemplate": ["ProjectTemplate"],
    "MemberSubsystemTemplate": ["SubsystemTemplate"],
    "SubsystemTemplate": ["SubsystemTemplate"],
    "EntityTemplate": ["EntityTemplate"],
    "ComponentTemplate": ["ComponentTemplate"],
    "MemberComponentTemplate": ["ComponentTemplate"],
    "ParameterSet": ["SubsystemTemplate", "MemberComponentTemplate"],
    "Parameter": []
};

export function updateDatabaseDiagnostics(document: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection, isPreposedDatabaseFile: boolean) {
    if (isPreposedDatabaseFile && !openedPreposedDatabaseFiles.includes(document.fileName)) {
        openedPreposedDatabaseFiles.push(document.fileName);
    }
    const text = document.getText();
    const diagnostics: vscode.Diagnostic[] = [];
    let match: RegExpMatchArray | null;

    if (document.fileName.toLowerCase().endsWith('.xdb') && !text.includes('xsi:noNamespaceSchemaLocation')) {
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

    removeGuidsFromDatabase(document.uri.fsPath);

    const gridViewPresetsStart = text.indexOf('<GridViewPresets>');
    const tagsWithNewValue = new Map<string, TagInfo[]>();
    tagWithGuidPattern.lastIndex = 0;
    while ((match = tagWithGuidPattern.exec(text)) !== null && match.index !== undefined) {
        if (gridViewPresetsStart !== -1 && match.index > gridViewPresetsStart) {
            break;
        }
        const tagName = match[1];
        const guid = match[2];
        const guidOffset = match.index + match[0].indexOf('Guid="');
        const startPos = document.positionAt(guidOffset);
        const endPos = document.positionAt(guidOffset + 43);
        const range = new vscode.Range(startPos, endPos);
        const name = match[0].match(/(?<=Name=").*?(?=")/)?.[0] ?? null;
        const isNewValue = match[0].includes('new-Value="');
        const tagInfo = new TagInfo(tagName, document.uri, range, name);

        let tags = isNewValue ? tagsWithNewValue.get(guid) : allTagsWithGuid.get(guid);
        if (tags) {
            tags.push(tagInfo);
        } else {
            if (isNewValue) {
                tagsWithNewValue.set(guid, [tagInfo]);
            } else {
                allTagsWithGuid.set(guid, [tagInfo]);
            }
        }
    }

    for (const [guid, tags] of allTagsWithGuid) {
        if (tags.length < 1) {
            continue;
        }
        for (const tag of tags) {
            if (tag.uri.fsPath !== document.uri.fsPath) {
                continue;
            }
            const relatedInformation: vscode.DiagnosticRelatedInformation[] = [];
            if (lowLevelTagNames.includes(tag.tagName)) {
                for (const tag1 of tags) {
                    if (tag1 !== tag) {
                        relatedInformation.push(new vscode.DiagnosticRelatedInformation(new vscode.Location(tag.uri, tag.range), vscode.l10n.t("diagnostics.duplicateGuidFound.relatedInformation")));
                    }
                }
            } else {
                const isFolder = tag.tagName === "Folder";
                for (const tag1 of tags) {
                    if (tag1.tagName !== tag.tagName || (isFolder && tag1 !== tag && tag1.tagName === "Folder" && tag1.uri.fsPath === tag.uri.fsPath)) {
                        relatedInformation.push(new vscode.DiagnosticRelatedInformation(new vscode.Location(tag1.uri, tag1.range), vscode.l10n.t("diagnostics.duplicateGuidFound.relatedInformation")));
                    }
                }
            }
            if (relatedInformation.length === 0) {
                continue;
            }
            const diagnostic = new vscode.Diagnostic(
                tag.range,
                vscode.l10n.t("diagnostics.duplicateGuidFound.message", guid),
                vscode.DiagnosticSeverity.Error
            );
            diagnostic.code = 'duplicateGuid';
            diagnostic.source = 'survivalcraft-content-toolkit';
            diagnostic.relatedInformation = relatedInformation;
            diagnostics.push(diagnostic);
        }
    }

    inheritanceParentPattern.lastIndex = 0;
    while ((match = inheritanceParentPattern.exec(text)) !== null && match.index !== undefined) {
        const tagName = match[1];
        const inheritanceParent = match[2];
        const inheritanceParentOffset = match.index + match[0].indexOf('InheritanceParent="');
        const startPos = document.positionAt(inheritanceParentOffset);
        const endPos = document.positionAt(inheritanceParentOffset + 56);
        const range = new vscode.Range(startPos, endPos);
        const name = match[0].match(/(?<=Name=").*?(?=")/)?.[0] ?? null;


        const allowed = allowedInheritanceParents[tagName] ?? [];
        if ((allowed.length ?? 0) === 0) {
            const diagnostic = new vscode.Diagnostic(
                range,
                vscode.l10n.t("diagnostics.tagCannotHaveInheritanceParent", `<${tagName}>`),
                vscode.DiagnosticSeverity.Error
            );
            diagnostic.code = 'tagCannotHaveInheritanceParent';
            diagnostic.source = 'survivalcraft-content-toolkit';
            diagnostics.push(diagnostic);
            continue;
        }
        const tags = allTagsWithGuid.get(inheritanceParent);
        if (tags && tags.length > 0) {
            const notAllowed = tags.filter(tag => !allowed.includes(tag.tagName));
            if (notAllowed.length > 0) {
                const diagnostic = new vscode.Diagnostic(
                    range,
                    vscode.l10n.t("diagnostics.invalidInheritanceParent", `<${tagName}>`),
                    vscode.DiagnosticSeverity.Error
                );
                diagnostic.code = 'invalidInheritanceParent';
                diagnostic.source = 'survivalcraft-content-toolkit';
                diagnostic.relatedInformation = notAllowed.map(tag => new vscode.DiagnosticRelatedInformation(new vscode.Location(tag.uri, tag.range), `<${tagName}>`));
                diagnostics.push(diagnostic);
            } else {
                const tagInfo = new TagInfo(tagName, document.uri, range, name);
                const tags1 = allTagsWithInheritanceParent.get(inheritanceParent);
                if (tags1) {
                    tags1.push(tagInfo);
                } else {
                    allTagsWithInheritanceParent.set(inheritanceParent, [tagInfo]);
                }
            }
        } else {
            const diagnostic = new vscode.Diagnostic(
                range,
                vscode.l10n.t("diagnostics.inheritanceParentNotFound", inheritanceParent),
                vscode.DiagnosticSeverity.Error
            );
            diagnostic.code = 'inheritanceParentNotFound';
            diagnostic.source = 'survivalcraft-content-toolkit';
            diagnostics.push(diagnostic);
        }
    }
    for (const [guid, tags] of tagsWithNewValue) {
        if (tags.length < 1 || allTagsWithGuid.has(guid)) {
            const tags1 = allTagsWithInheritanceParent.get(guid);
            if (tags1) {
                tags1.push(...tags);
            } else {
                allTagsWithInheritanceParent.set(guid, tags);
            }
            continue;
        }
        for (const tag of tags) {
            const diagnostic = new vscode.Diagnostic(
                tag.range,
                vscode.l10n.t("diagnostics.inheritanceParentNotFound", guid),
                vscode.DiagnosticSeverity.Error
            );
            diagnostic.code = 'notFoundElementWithSameGuid';
            diagnostic.source = 'survivalcraft-content-toolkit';
        }
    }

    diagnosticCollection.set(document.uri, diagnostics);
}

export function removeGuidsFromDatabase(fsPath: string) {
    const toUpdates = new Map<string, TagInfo[]>();
    for (const [guid, tags] of allTagsWithGuid) {
        let toUpdate = tags.filter(tag => tag.uri.fsPath !== fsPath);
        if (toUpdate.length !== tags.length) {
            toUpdates.set(guid, toUpdate);
        }
    }
    for (const [guid, tags] of toUpdates) {
        if (tags.length === 0) {
            allTagsWithGuid.delete(guid);
        } else {
            allTagsWithGuid.set(guid, tags);
        }
    }
    toUpdates.clear();
    for (const [guid, tags] of allTagsWithInheritanceParent) {
        let toUpdate = tags.filter(tag => tag.uri.fsPath !== fsPath);
        if (toUpdate.length !== tags.length) {
            toUpdates.set(guid, toUpdate);
        }
    }
    for (const [guid, tags] of toUpdates) {
        if (tags.length === 0) {
            allTagsWithInheritanceParent.delete(guid);
        } else {
            allTagsWithInheritanceParent.set(guid, tags);
        }
    }
}

export function closeDatabaseDiagnostics(fsPath: string, isPreposedDatabaseFile: boolean) {
    if (!isPreposedDatabaseFile) {
        removeGuidsFromDatabase(fsPath);
    }
}