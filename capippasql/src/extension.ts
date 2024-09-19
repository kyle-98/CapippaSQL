import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('capippalizesql.capippalizeKeywords', () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const document = editor.document;
      
      // Retrieve configuration for the extension
      const config = vscode.workspace.getConfiguration('capippalizesql');
      
      // Get the keywords from the configuration (default to an empty array if not found)
      const keywords = config.get<string[]>('keywords', []);
      
      // Get the toggle setting for capitalizing everything except variables
      const capitalizeEverything = config.get<boolean>('capitalizeEverythingExceptVariables', false);
      
      const text = document.getText();
      let newText;

      // Capitalize either a predefined set of keywords or everything except variables
      if (capitalizeEverything) {
        newText = capitalizeExceptVariables(text);
      } else {
        newText = capitalizeSQLKeywords(text, keywords);
      }

      // Apply the changes to the text
      editor.edit(editBuilder => {
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(text.length)
        );
        editBuilder.replace(fullRange, newText);
      });
    }
  });

  context.subscriptions.push(disposable);
}

// Function to capitalize SQL keywords from the config
function capitalizeSQLKeywords(text: string, keywords: string[]): string {
  const commentPattern = /(--.*$)|((\/\*[\s\S]*?\*\/))/gm;
  const keywordPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');

  return text
    .replace(commentPattern, match => match)
    .replace(keywordPattern, match => match.toUpperCase());
}

// Function to capitalize everything except variables defined in procedures or functions
function capitalizeExceptVariables(text: string): string {
  const commentPattern = /(--.*$)|((\/\*[\s\S]*?\*\/))/gm;
  const procedurePattern = /(?:PROCEDURE|FUNCTION)\s+\w+\s*\([\s\S]*?\)\s*IS\s*\b([\s\S]*?)\bBEGIN/gi;

  // Capture variable names defined inside procedures or functions
  const variablePattern = /\b(\w+)\s+(?:VARCHAR2|NUMBER|DATE|TIMESTAMP|INTEGER|CHAR)\b/gi;
  const variables: Set<string> = new Set();

  text.replace(procedurePattern, (match, p1) => {
    let procVariables = p1.match(variablePattern);
    if (procVariables) {
      procVariables.forEach((v: string) => {
        let variableName = v.split(/\s+/)[0];
        variables.add(variableName.toUpperCase());
      });
    }
    return match;
  });

  // Capitalize everything except comments and variables
  const wordPattern = /\b(\w+)\b/g;

  return text
    .replace(commentPattern, match => match)
    .replace(wordPattern, match => {
      if (!variables.has(match.toUpperCase())) {
        return match.toUpperCase();
      }
      return match;
    });
}

export function deactivate() {}
