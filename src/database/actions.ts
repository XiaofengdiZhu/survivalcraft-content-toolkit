import * as vscode from 'vscode';
import { allTagsWithGuid, allTagsWithInheritanceParent, isDatabaseFile, TagInfo } from './diagnostics';

export function initeDatabaseActions(subscriptions: vscode.Disposable[]) {
    subscriptions.push(vscode.languages.registerCodeActionsProvider("xml", new GuidCodeActionProvider(), {
        providedCodeActionKinds: GuidCodeActionProvider.providedCodeActionKinds
    }));
    subscriptions.push(vscode.languages.registerReferenceProvider("xml", new GuidReferenceProvider()));
    subscriptions.push(vscode.languages.registerHoverProvider("xml", new GuidHoverProvider()));
    subscriptions.push(vscode.languages.registerDefinitionProvider("xml", new InheritanceParentDefinitionProvider()));
    subscriptions.push(vscode.languages.registerHoverProvider("xml", new InheritanceParentHoverProvider()));
    subscriptions.push(vscode.languages.registerDefinitionProvider("xml", new NewValueGuidDefinitionProvider()));
    subscriptions.push(vscode.languages.registerHoverProvider("xml", new NewValueGuidHoverProvider()));
};

class GuidCodeActionProvider implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeAction[]> {
        const actions: vscode.CodeAction[] = [];
        if (!isDatabaseFile(document.fileName)) {
            return actions;
        }
        const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
        for (const diagnostic of context.diagnostics) {
            switch (diagnostic.code) {
                case 'duplicateGuid': {
                    const action = new vscode.CodeAction(vscode.l10n.t("actions.replaceWithRandomGuid"), vscode.CodeActionKind.QuickFix);
                    action.edit = new vscode.WorkspaceEdit();
                    action.edit.replace(document.uri, diagnostic.range, `Guid="${this.generateRandomGuid()}"`);
                    action.diagnostics = [diagnostic];
                    action.isPreferred = true;
                    actions.push(action);
                    break;
                }
                case 'xsdNotSet': {
                    const oldStartTag = document.getText(diagnostic.range);
                    const match = oldStartTag.match(/<\w+/);
                    if (match) {
                        const action = new vscode.CodeAction(vscode.l10n.t("actions.setDatabaseXsd"), vscode.CodeActionKind.QuickFix);
                        action.edit = new vscode.WorkspaceEdit();
                        const xmlnsXsi = ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';
                        action.edit.insert(document.uri, diagnostic.range.start.translate(0, match[0].length), `${oldStartTag.includes(xmlnsXsi) ? '' : xmlnsXsi} xsi:noNamespaceSchemaLocation="${config.get('defaultDatabaseXsdPath') ?? 'https://gitee.com/THPRC/survivalcraft-api/raw/SCAPI1.8/Survivalcraft/Content/Assets/Database.xsd'}"`);
                        action.diagnostics = [diagnostic];
                        action.isPreferred = true;
                        actions.push(action);
                    }
                    break;
                }
                case 'cvc-elt.1.a': {
                    if (range.start.line === 0 || range.start.line === 1) {
                        const action = new vscode.CodeAction(vscode.l10n.t("actions.replaceRootElementToMod"), vscode.CodeActionKind.QuickFix);
                        const oldEndTag = `</${document.getText(diagnostic.range)}>`;
                        action.edit = new vscode.WorkspaceEdit();
                        action.edit.replace(document.uri, diagnostic.range, `Mod`);
                        //将根元素的结束标签也替换为</Mod>
                        const fullDocumentText = document.getText();
                        const endTagIndex = fullDocumentText.indexOf(oldEndTag);
                        if (endTagIndex !== -1) {
                            const endTagRange = new vscode.Range(
                                document.positionAt(endTagIndex),
                                document.positionAt(endTagIndex + oldEndTag.length)
                            );
                            action.edit.replace(document.uri, endTagRange, `</Mod>`);
                        }
                        action.diagnostics = [diagnostic];
                        action.isPreferred = true;
                        actions.push(action);
                    }
                    break;
                }
            }
        }
        return actions;
    }

    private generateRandomGuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

const guidParentPattern = /Guid="([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})"/;

class GuidReferenceProvider implements vscode.ReferenceProvider {
    public provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken):
        vscode.ProviderResult<vscode.Location[]> {
        const match = getMatch(document, position, guidParentPattern)?.result;
        if (match && match[1]) {
            const tags = allTagsWithInheritanceParent.get(match[1]);
            if (tags && tags.length > 0) {
                const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
                const preposedDatabaseFiles: string[] = config.get('preposedDatabaseFiles') ?? [];
                const locations: vscode.Location[] = sortTags(tags, document.uri.fsPath, preposedDatabaseFiles).map(tag => new vscode.Location(tag.uri, tag.range));
                return Promise.resolve(locations);
            }
        }
    }
}

class GuidHoverProvider implements vscode.HoverProvider {
    public provideHover(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):
        vscode.ProviderResult<vscode.Hover> {
        const match = getMatch(document, position, guidParentPattern);
        if (match && match.result[1]) {
            const tags = allTagsWithInheritanceParent.get(match.result[1]);
            if (tags && tags.length > 0) {
                const lines: string[] = [];
                for (const tag of tags) {
                    lines.push(generateTagHtml(tag));
                }
                const markdownString = new vscode.MarkdownString(vscode.l10n.t("actions.guidReferencedBy") + lines.join('\n\n'));
                markdownString.isTrusted = true;
                markdownString.supportHtml = true;
                return Promise.resolve(new vscode.Hover(markdownString, match.range));
            }
        }
    }
}

const inheritanceParentPattern = /InheritanceParent="([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})"/;

class InheritanceParentDefinitionProvider implements vscode.DefinitionProvider {
    public provideDefinition(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):
        vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
        const match = getMatch(document, position, newValueGuidPattern)?.result;
        if (match && match[1]) {
            const tags = allTagsWithGuid.get(match[1]);
            if (tags && tags.length > 0) {
                const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
                const preposedDatabaseFiles: string[] = config.get('preposedDatabaseFiles') ?? [];
                const locations: vscode.Location[] = sortTags(tags, document.uri.fsPath, preposedDatabaseFiles).map(tag => new vscode.Location(tag.uri, tag.range));
                return Promise.resolve(locations);
            }
        }
    }
}

class InheritanceParentHoverProvider implements vscode.HoverProvider {
    public provideHover(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):
        vscode.ProviderResult<vscode.Hover> {
        const match = getMatch(document, position, inheritanceParentPattern);
        if (match && match.result[1]) {
            return generateGuidDefinitionHover(match.result[1], match.range);
        }
    }
}

const newValueGuidPattern = /Guid="([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})" new-Value=".*?"/;

class NewValueGuidDefinitionProvider implements vscode.DefinitionProvider {
    public provideDefinition(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):
        vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
        const match = getMatch(document, position, newValueGuidPattern)?.result;
        if (match && match[1]) {
            const tags = allTagsWithGuid.get(match[1]);
            if (tags && tags.length > 0) {
                const config = vscode.workspace.getConfiguration('survivalcraft-content-toolkit');
                const preposedDatabaseFiles: string[] = config.get('preposedDatabaseFiles') ?? [];
                const locations: vscode.Location[] = sortTags(tags, document.uri.fsPath, preposedDatabaseFiles).map(tag => new vscode.Location(tag.uri, tag.range));
                return Promise.resolve(locations);
            }
        }
    }
}

class NewValueGuidHoverProvider implements vscode.HoverProvider {
    public provideHover(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):
        vscode.ProviderResult<vscode.Hover> {
        const match = getMatch(document, position, newValueGuidPattern);
        if (match && match.result[1]) {
            return generateGuidDefinitionHover(match.result[1], match.range);
        }
    }
}

function generateGuidDefinitionHover(guid: string, range: vscode.Range): vscode.ProviderResult<vscode.Hover> {
    const tags = allTagsWithGuid.get(guid);
    if (tags && tags.length > 0) {
        const lines: string[] = [];
        for (const tag of tags) {
            lines.push(generateTagHtml(tag));
        }
        const markdownString = new vscode.MarkdownString(vscode.l10n.t("actions.guidDefinedAt") + lines.join('\n\n'));
        markdownString.isTrusted = true;
        return Promise.resolve(new vscode.Hover(markdownString, range));
    }
}

function getMatch(document: vscode.TextDocument, position: vscode.Position, pattern: RegExp): { result: RegExpMatchArray, range: vscode.Range } | null {
    if (!isDatabaseFile(document.fileName)) {
        return null;
    }
    const wordRange = document.getWordRangeAtPosition(position, pattern);
    if (!wordRange) {
        return null;
    }
    const match = document.getText(wordRange).match(pattern);
    return match ? { result: match, range: wordRange } : null;
}

function sortTags(tags: TagInfo[], fsPath: string, preposedDatabaseFiles: string[]) {
    return tags.toSorted((a, b) => a.range.start.line - b.range.start.line - (a.uri.fsPath === fsPath && b.uri.fsPath !== fsPath ? 30000 : 0) - (a.uri.fsPath.endsWith('Database.xml') && !b.uri.fsPath.endsWith('Database.xml') ? 20000 : 0) - (preposedDatabaseFiles.includes(a.uri.fsPath) && !preposedDatabaseFiles.includes(b.uri.fsPath) ? 10000 : 0));
}

function generateTagHtml(tag: TagInfo){
    const args = [
        tag.uri.toString(),
        tag.range.start.line,
        tag.range.start.character,
        tag.range.end.line,
        tag.range.end.character
    ];
    const fileName = tag.uri.fsPath.split('\\').pop() || tag.uri.fsPath.split('/').pop();
    return `[${fileName}#${tag.range.start.line + 1}:${tag.range.start.character + 1}](command:survivalcraft-content-toolkit.openFile?${encodeURIComponent(JSON.stringify(args))}) (${vscode.l10n.t("main.tagTitle")}: \`${tag.tagName}\` ${vscode.l10n.t("main.nameTitle")}: \`${tag.name}\`)`;
}