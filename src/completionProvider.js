const vscode = require('vscode');
// const utilities = require('./utilities');


/**
 * @description - register a CompletionItemProvider for keybindings.json
 * @param {vscode.ExtensionContext} context
 */
exports.makeKeybindingsCompletionProvider = function(context) {
    const configCompletionProvider = vscode.languages.registerCompletionItemProvider (
      { pattern: '**/keybindings.json' },
      {
        provideCompletionItems(document, position) {

           	// {
						// 	"key": "alt+r",
						// 	"command": "jump-and-select.jumpForward",  	// jumpForwardSelect, jumpBackward, jumpBackwardSelect
						// 	"args": {
						// 		"text"              : "mark",
						// 		"putCursorForward"  : "afterCharacter",  			// beforeCharacter
						// 		"putCursorBackward" : "afterCharacter", 			// beforeCharacter
						// 		"restrictSearch"    : "line"                  // document
						// 	}
						// }

					const linePrefix = document.lineAt(position).text.substr(0, position.character);

					// "jump-and-select." command completion
					if (linePrefix.endsWith('"jump-and-select.')) {
						return [
							_makeCompletionItem('jumpForward', position),
							_makeCompletionItem('jumpForwardSelect', position),
							_makeCompletionItem('jumpBackward', position),
							_makeCompletionItem('jumpBackwardSelect', position)
						];
					}

					// intellisense/completion for 'args' options values
					if (linePrefix.endsWith('"putCursorForward": "')) {
						return [
							_makeCompletionItem('beforeCharacter', position),
							_makeCompletionItem('afterCharacter', position)
						];
					}
					else if (linePrefix.endsWith('"putCursorBackward": "')) {
						return [
							_makeCompletionItem('beforeCharacter', position),
							_makeCompletionItem('afterCharacter', position)
						];
					}
					else if (linePrefix.endsWith('"restrictSearch": "')) {
						return [
							_makeCompletionItem("line", position),
							_makeCompletionItem("document", position)
						];
					}
					else if (linePrefix.endsWith('"text": "')) {
						return undefined;
					}

					// 'args' options keys intellisense/completions
					const firstLine = document.lineAt(0);
					let curStartRange = new vscode.Range(position, firstLine.range.start);

					const lastCommandIndex = document.getText(curStartRange).lastIndexOf("jump-and-select");
					const commandLinePos = document.positionAt(lastCommandIndex);
					const commandSearch = [...document.lineAt(commandLinePos).text.matchAll(/jump-and-select\.(?<command>[^"]+)/g)];

					let command;
					if (commandSearch.length) command = commandSearch[0].groups?.command;
					else return undefined;  // notify no command

					// next line after command should be "args": {}
					const lineAfterCommand = document.lineAt(commandLinePos.line + 1);
					if (lineAfterCommand.text.search(/"args"\s*:\s*{/g) === -1) return undefined;

					const argsStartingIndex = document.offsetAt(lineAfterCommand.range.start);
					let lastLine = document.lineAt(document.lineCount - 1);

					const argSearchRange = new vscode.Range(new vscode.Position(commandLinePos.line + 1, 0), lastLine.range.end);
					const argsClosingIndex = document.getText(argSearchRange).indexOf("}");

					const argsRange = new vscode.Range(lineAfterCommand.range.end, document.positionAt(argsClosingIndex + argsStartingIndex + 1));
					const argsText = document.getText(argsRange);

					if (!argsRange.contains(position) || linePrefix.search(/^\s*"/m) === -1) return undefined;

					const forwardArray = ["text", "putCursorForward", "restrictSearch"];
					const backwardArray = ["text", "putCursorBackward", "restrictSearch"];

					// eliminate any options already used
					if ((command === "jumpForward") || (command === "jumpForwardSelect")) {
						return _completionsItemsNotUsed(forwardArray, argsText, position);
					}
					else if ((command === "jumpBackward") || (command === "jumpBackwardSelect")) {
						return _completionsItemsNotUsed(backwardArray, argsText, position);

					}
					else return undefined;
        }
      },
      '.', '"'   // trigger intellisense/completion
    );

  context.subscriptions.push(configCompletionProvider);
};


/**
 * From a string input make a CompletionItemKind.Text
 *
 * @param {string} key
 * @param {vscode.Position} position
 * @returns {vscode.CompletionItem} - CompletionItemKind.Text
 */
function _makeCompletionItem(key, position) {

	let item;

	if (key === "true" || key === "false") {
		item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Keyword);
	}
	else item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Text);

	item.range = new vscode.Range(position, position);
	// item.detail = ;

  // item.sortText = setting.folder;

  // item.insertText = key.replace(stripSpaces, ' $2');

  return item;
}

/**
 * Make CompletionItem arrays, eliminate already used option keys found in the args text
 *
 * @param {string[]} directionArray - options for forward or backward commands
 * @param {string} argsText - text of the 'args' options:  "args": { .... }
 * @param {vscode.Position} position - cursor position
 * @returns {Array<vscode.CompletionItem>}
 */
function _completionsItemsNotUsed(directionArray, argsText, position) {

	/** @type { Array<vscode.CompletionItem> } */
	let completionArray = [];

	// doesn't account for commented options or the word "text" appeearing in another option for example
	// have to use something other than 'includes'
	directionArray.forEach(option => {
		if (!argsText.includes(`"${option}"`)) completionArray.push(_makeCompletionItem(option, position));
	});

	return completionArray;
}