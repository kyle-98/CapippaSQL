# CapippaSQL

An extension for Visual Studio Code to capitalize SQL keywords and text.

## Features

- Capitalize SQL keywords
- Capitalize everything except user-defined variables

## Installation

You can install the extension from the VS Code marketplace or by using the `.vsix` file.

## Usage

1. Open the Command Palette (`Ctrl+Shift+P`).
2. Type `Capitalize SQL Keywords` and select the command.
3. Configure the extension settings as needed.

## Configuration

You can configure the extension in your VS Code settings:

```json
"capippasql.keywords": [
    "SELECT",
    "FROM",
    "WHERE"
],
"capippasql.capitalizeEverythingExceptVariables": true
