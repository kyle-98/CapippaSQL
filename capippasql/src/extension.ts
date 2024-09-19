import * as vscode from 'vscode';

// Activate function is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {
    let capitalizeCommand = vscode.commands.registerCommand('capippasql.capippalizeKeywords', () => {
        capitalizeKeywords();
    });

    // Add the command to the context subscriptions
    context.subscriptions.push(capitalizeCommand);
}

export function deactivate() {}

// Function to capitalize SQL keywords or everything except variables, depending on configuration
function capitalizeKeywords() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No active editor found.');
        return;
    }

    const document = editor.document;
    const text = document.getText();
    
    // Get configuration settings
    const keywords = vscode.workspace.getConfiguration('capippasql').get<string[]>('keywords') || [];
    const capitalizeAll = vscode.workspace.getConfiguration('capippasql').get<boolean>('capitalizeEverythingExceptVariables') || false;

    // Apply capitalization, handling whether we capitalize everything or just keywords
    const capitalizedText = capitalizeAll 
        ? applyCapitalizationAll(text) 
        : applyCapitalization(text, keywords);

    // Replace the document text with capitalized text
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(text.length)
    );
    edit.replace(document.uri, fullRange, capitalizedText);
    vscode.workspace.applyEdit(edit);
}

// Function to apply capitalization to everything except variables
function applyCapitalizationAll(text: string): string {
    // Extract comments and strings from the text so they are not affected
    const { codeWithoutCommentsAndStrings, comments, strings } = extractCommentsAndStrings(text);

    // Find variables inside procedures, functions, or packages
    const VARIABLE_REGEX = /\b(\w+)\b(?=\s+(VARCHAR2|NUMBER|INTEGER|BOOLEAN|DATE|TIMESTAMP|CHAR|PLS_INTEGER|CLOB|BLOB|BINARY_FLOAT|BINARY_DOUBLE|RAW|NVARCHAR2|NCHAR|NCLOB))\b/gi;
    const variables = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = VARIABLE_REGEX.exec(codeWithoutCommentsAndStrings)) !== null) {
        variables.add(match[1]);
    }

    // Capitalize everything except variables
    const capitalizedCode = codeWithoutCommentsAndStrings.replace(/\b\w+\b/g, (word) => {
        return variables.has(word) ? word : word.toUpperCase();
    });

    // Restore the strings and comments to their original positions
    return restoreCommentsAndStrings(capitalizedCode, comments, strings);
}

// Function to apply capitalization only to predefined keywords
function applyCapitalization(text: string, keywords: string[]): string {
    // Normalize keywords to uppercase
    const uppercaseKeywords = keywords.map(keyword => keyword.toUpperCase());

    // Extract comments and strings so they are not affected
    const { codeWithoutCommentsAndStrings, comments, strings } = extractCommentsAndStrings(text);

    // Find variables inside procedures, functions, or packages
    const VARIABLE_REGEX = /\b(\w+)\b(?=\s+(VARCHAR2|NUMBER|INTEGER|BOOLEAN|DATE|TIMESTAMP|CHAR|PLS_INTEGER|CLOB|BLOB|BINARY_FLOAT|BINARY_DOUBLE|RAW|NVARCHAR2|NCHAR|NCLOB))\b/gi;
    const variables = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = VARIABLE_REGEX.exec(codeWithoutCommentsAndStrings)) !== null) {
        variables.add(match[1]);
    }

    // Apply capitalization to keywords
    const KEYWORD_REGEX = new RegExp(`\\b(${uppercaseKeywords.join('|')})\\b`, 'gi');
    const capitalizedCode = codeWithoutCommentsAndStrings.replace(KEYWORD_REGEX, (match) => {
        return variables.has(match.toLowerCase()) ? match : match.toUpperCase();
    });

    // Restore the strings and comments to their original positions
    return restoreCommentsAndStrings(capitalizedCode, comments, strings);
}

// Extract comments and strings from the code and return the code without comments or strings
function extractCommentsAndStrings(text: string): { codeWithoutCommentsAndStrings: string, comments: { position: number, comment: string }[], strings: { position: number, str: string }[] } {
    const COMMENT_REGEX = /(--.*?$|\/\*[\s\S]*?\*\/)/gm;
    const STRING_REGEX = /(['"])(?:(?=(\\?))\2.)*?\1/g;

    const comments: { position: number, comment: string }[] = [];
    const strings: { position: number, str: string }[] = [];
    let codeWithoutCommentsAndStrings = text;

    let match: RegExpExecArray | null;

    // Extract comments
    while ((match = COMMENT_REGEX.exec(text)) !== null) {
        comments.push({ position: match.index, comment: match[0] });
        codeWithoutCommentsAndStrings = replaceWithSpacesKeepingNewlines(codeWithoutCommentsAndStrings, match.index, match[0]);
    }

    // Extract strings
    while ((match = STRING_REGEX.exec(text)) !== null) {
        strings.push({ position: match.index, str: match[0] });
        codeWithoutCommentsAndStrings = replaceWithSpacesKeepingNewlines(codeWithoutCommentsAndStrings, match.index, match[0]);
    }

    return { codeWithoutCommentsAndStrings, comments, strings };
}

// Replace a section with spaces but preserve line breaks
function replaceWithSpacesKeepingNewlines(text: string, startIndex: number, match: string): string {
    const SPACES = match.replace(/[^\r\n]/g, ' ');
    return text.slice(0, startIndex) + SPACES + text.slice(startIndex + match.length);
}

// Restore the comments and strings into their original positions
function restoreCommentsAndStrings(code: string, comments: { position: number, comment: string }[], strings: { position: number, str: string }[]): string {
    let restoredCode = code;

    comments.reverse().forEach(comment => {
        restoredCode = restoredCode.slice(0, comment.position) + comment.comment + restoredCode.slice(comment.position + comment.comment.length);
    });

    strings.reverse().forEach(str => {
        restoredCode = restoredCode.slice(0, str.position) + str.str + restoredCode.slice(str.position + str.str.length);
    });

    return restoredCode;
}
