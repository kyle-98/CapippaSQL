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
    // Find and remove comments from the text so they are not affected
    const { codeWithoutComments, comments } = extractComments(text);

    // Find variables inside procedures, functions, or packages
    const variableRegex = /\b(\w+)\b(?=\s+VARCHAR2|\s+NUMBER|\s+INTEGER|\s+BOOLEAN|\s+DATE|\s+TIMESTAMP|\s+CHAR)/gi;
    const variables = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = variableRegex.exec(codeWithoutComments)) !== null) {
        variables.add(match[1]);
    }

    // Capitalize everything except variables
    const capitalizedCode = codeWithoutComments.replace(/\b\w+\b/g, (word) => {
        return variables.has(word) ? word : word.toUpperCase();
    });

    // Restore the comments to their original positions
    return restoreComments(capitalizedCode, comments);
}

// Function to apply capitalization only to predefined keywords
function applyCapitalization(text: string, keywords: string[]): string {
    // Normalize keywords to uppercase
    const uppercaseKeywords = keywords.map(keyword => keyword.toUpperCase());

    // Extract comments so they are not affected
    const { codeWithoutComments, comments } = extractComments(text);

    // Find variables inside procedures, functions, or packages
    const variableRegex = /\b(\w+)\b(?=\s+VARCHAR2|\s+NUMBER|\s+INTEGER|\s+BOOLEAN|\s+DATE|\s+TIMESTAMP|\s+CHAR)/gi;
    const variables = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = variableRegex.exec(codeWithoutComments)) !== null) {
        variables.add(match[1]);
    }

    // Apply capitalization to keywords
    const keywordRegex = new RegExp(`\\b(${uppercaseKeywords.join('|')})\\b`, 'gi');
    const capitalizedCode = codeWithoutComments.replace(keywordRegex, (match) => {
        return match.toUpperCase();
    });

    // Restore the comments to their original positions
    return restoreComments(capitalizedCode, comments);
}

// Extract comments from the code and return the code without comments
function extractComments(text: string): { codeWithoutComments: string, comments: { position: number, comment: string }[] } {
    const commentRegex = /(--.*?$|\/\*[\s\S]*?\*\/)/gm;
    const comments: { position: number, comment: string }[] = [];
    let codeWithoutComments = text;

    let match: RegExpExecArray | null;
    while ((match = commentRegex.exec(text)) !== null) {
        comments.push({ position: match.index, comment: match[0] });
        codeWithoutComments = codeWithoutComments.replace(match[0], ' '.repeat(match[0].length));
    }

    return { codeWithoutComments, comments };
}

// Restore the comments into their original positions
function restoreComments(code: string, comments: { position: number, comment: string }[]): string {
    let restoredCode = code;
    comments.reverse().forEach(comment => {
        restoredCode = restoredCode.slice(0, comment.position) + comment.comment + restoredCode.slice(comment.position);
    });
    return restoredCode;
}
