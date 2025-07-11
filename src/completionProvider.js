const { languages, Range, Position, CompletionItem, CompletionItemKind } = require('vscode');


/**
 * @description - register a CompletionItemProvider for keybindings.json
 * @param { import("vscode").ExtensionContext} context
 */
exports.makeKeybindingsCompletionProvider = function (context) {
	const configCompletionProvider = languages.registerCompletionItemProvider(
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

				const linePrefix = document.lineAt(position).text.substring(0, position.character);

				// \t\t\t\"putCursorForward
				// \t\t\t\"putCursor  // and fix range fro replacement

				// "jump-and-select." command completion
				if (linePrefix.endsWith('"jump-and-select.')) {
					return [
						_makeCompletionItem('jumpForward', position, ""),
						_makeCompletionItem('jumpForwardSelect', position, ""),
						_makeCompletionItem('jumpBackward', position, ""),
						_makeCompletionItem('jumpBackwardSelect', position, "")
					];
				}

				// 'args' options keys intellisense/completions
				const firstLine = document.lineAt(0);
				let curStartRange = new Range(position, firstLine.range.start);

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

				const argSearchRange = new Range(new Position(commandLinePos.line + 1, 0), lastLine.range.end);
				const argsClosingIndex = document.getText(argSearchRange).indexOf("}");

				const argsRange = new Range(lineAfterCommand.range.end, document.positionAt(argsClosingIndex + argsStartingIndex + 1));
				const argsText = document.getText(argsRange);

				if (!argsRange.contains(position) || linePrefix.search(/^\s*"/m) === -1) return undefined;

				// intellisense/completion for 'args' options values
				if (argsRange.contains(position) && linePrefix.endsWith('"putCursorForward": "')) {
					return [
						_makeCompletionItem('beforeCharacter', position, "beforeCharacter"),
						_makeCompletionItem('afterCharacter', position, "beforeCharacter")
					];
				}
				else if (argsRange.contains(position) && linePrefix.endsWith('"putCursorBackward": "')) {
					return [
						_makeCompletionItem('beforeCharacter', position, "beforeCharacter"),
						_makeCompletionItem('afterCharacter', position, "beforeCharacter")
					];
				}
				else if (argsRange.contains(position) && linePrefix.endsWith('"restrictSearch": "')) {
					return [
						_makeCompletionItem("line", position, "document"),
						_makeCompletionItem("document", position, "document")
					];
				}
				else if (argsRange.contains(position) && linePrefix.endsWith('"text": "')) {
					return undefined;
				}

				const forwardArray = ["text", "putCursorForward", "restrictSearch"];
				const backwardArray = ["text", "putCursorBackward", "restrictSearch"];

				// eliminate any options already used
				if ((command === "jumpForward") || (command === "jumpForwardSelect")) {
					return _filterCompletionsItemsNotUsed(forwardArray, argsText, position);
				}
				else if ((command === "jumpBackward") || (command === "jumpBackwardSelect")) {
					return _filterCompletionsItemsNotUsed(backwardArray, argsText, position);

				}
				else return undefined;
			}
		},
		'"', '.'   // trigger intellisense/completion
	);

	context.subscriptions.push(configCompletionProvider);
};


/**
 * From a string input make a CompletionItemKind.Text
 *
 * @param { string } key
 * @param { Position } position
 * @param { string } defaultValue - default value for this option
 * 
 * @returns { CompletionItem } - CompletionItemKind.Text
 */
function _makeCompletionItem(key, position, defaultValue) {

	let item = new CompletionItem(key, CompletionItemKind.Property);

	item.range = new Range(position, position);

	if (defaultValue) item.detail = `default: ${defaultValue}`;
	return item;
}

/**
 * Make CompletionItem arrays, eliminate already used option keys found in the args text
 *
 * @param { string[] } directionArray - options for forward or backward commands
 * @param { string } argsText - text of the 'args' options:  "args": { .... }
 * @param { Position } position - cursor position
 * 
 * @returns { Array<CompletionItem> }
 */
function _filterCompletionsItemsNotUsed(directionArray, argsText, position) {

	const defaults = {
		"text": "",
		"putCursorForward": "beforeCharacter",
		"putCursorBackward": "beforeCharacter",
		"restrictSearch": "document"
	};

	return directionArray
		.filter(option => argsText.search(new RegExp(`^[ \t]*"${option}"`, "gm")) === -1)
		.map(option => {
			// @ts-ignore
			return _makeCompletionItem(option, position, defaults[`${option}`]);
		});

}