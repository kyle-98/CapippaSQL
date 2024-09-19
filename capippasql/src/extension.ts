import * as vscode from 'vscode';

// Activate function
export function activate(context: vscode.ExtensionContext) {
    let capitalizeCommand = vscode.commands.registerCommand('capippasql.capippalizeKeywords', () => {
        capitalizeKeywords();
    });

    context.subscriptions.push(capitalizeCommand);
}

export function deactivate() {}

// Function to capitalize SQL keywords
function capitalizeKeywords() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No active editor found.');
        return;
    }

    const document = editor.document;
    const text = document.getText();

    const config = vscode.workspace.getConfiguration('capippasql');
    const keywords = config.get<string[]>('keywords') || [];
    const ignoreVariables = config.get<boolean>('capitalizeEverythingExceptVariables') || false;

    // Extract the variables declared in the procedure/function
    const variables = ignoreVariables ? extractVariables(text) : [];

    // Apply capitalization, skipping variables
    const capitalizedText = ignoreVariables
        ? capitalizeAllExceptVariables(text, keywords, variables)
        : capitalizePredefinedKeywords(text, keywords);

    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(text.length)
    );
    edit.replace(document.uri, fullRange, capitalizedText);
    vscode.workspace.applyEdit(edit).then(success => {
        if (success) {
            vscode.window.showInformationMessage('SQL keywords capitalized successfully.');
        } else {
            vscode.window.showErrorMessage('Failed to capitalize SQL keywords.');
        }
    });
}

// Extract variables declared in PL/SQL
function extractVariables(text: string): string[] {
    // Regex to match variable declarations (basic, can be extended)
    const variableRegex = /\b(\w+)\s+(VARCHAR2|NUMBER|DATE|CHAR|FLOAT|BOOLEAN|INTEGER|CLOB|BLOB|RAW|DATE|TIMESTAMP|INTERVAL|BOOLEAN|BINARY_FLOAT|BINARY_DOUBLE)\b/g;
    const variables: string[] = [];

    let match;
    while ((match = variableRegex.exec(text)) !== null) {
        variables.push(match[1].toUpperCase());
    }

    return variables;
}

// Function to capitalize all keywords except for variables
function capitalizeAllExceptVariables(text: string, keywords: string[], variables: string[]): string {
    // First, split the text into lines for processing
    const lines = text.split(/\r?\n/);
	vscode.window.showErrorMessage(variables.join(', '));

    // Store capitalized lines
    const capitalizedLines = lines.map(line => {
        // Identify if the line is part of a SQL statement or a comment
        // and apply different processing based on that
        if (line.trim().startsWith("--")) {
            // Skip comments
            return line;
        }

        const capitalizedLine = line.replace(/\b(\w+)\b/g, (match) => {
            const upperMatch = match.toUpperCase();
			
			vscode.window.showErrorMessage(variables.join(', '));
            if (variables.includes(upperMatch)) {
				vscode.window.showErrorMessage(match + " | " + upperMatch);
                return match; // Skip variable
            } else {
				return upperMatch;
			}
            
        });
        return capitalizedLine;
    });

    return capitalizedLines.join('\n');
}

// Function to capitalize predefined keywords only
function capitalizePredefinedKeywords(text: string, keywords: string[]): string {
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
    return text.replace(keywordRegex, (match) => match.toUpperCase());
}
