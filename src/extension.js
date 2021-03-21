const vscode = require('vscode');
const commands = require('./commandFunctions');
const providers = require('./completionProvider');


/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

	let restrict             =   _getRestrictSetting();
	let putCursorForward     =   _getCusorPlacementForwardSetting();
	let putCursorBackward    =   _getCusorPlacementBackwardSetting();
	let multiMode = false;

	providers.makeKeybindingsCompletionProvider(context);


	let commandDisposable1 = vscode.commands.registerCommand('jump-and-select.jumpForward', (args) => {

		// multiple args like '{ text: "mark", putCursorForward: "beforeCharacter",
		//											 putCursorBackward: "beforeCharacter", "restrictSearch": "line" }

		let kbText = args ? args.text : "";  // if args means triggered via a keybinding
		multiMode = false;

		// check if args.putCursorForward is "beforeCharacter" or "afterCharacter"

		// 2 modes ogf commands: single mode - one character at a time
		//                       multi mode - trigger command, move cursor character by character until command disabled

		commands.jumpForward(
			args?.restrictSearch || restrict, args?.putCursorForward || putCursorForward, kbText, multiMode);
	});

	let commandDisposable1m = vscode.commands.registerCommand('jump-and-select.jumpForwardMultiMode', (args) => {
		let kbText = args ? args.text : "";  // if args means triggered via a keybinding
		multiMode = true;
		commands.jumpForward(args?.restrictSearch || restrict, args?.putCursorForward || putCursorForward, kbText, multiMode);
	});


	let commandDisposable2 = vscode.commands.registerCommand('jump-and-select.jumpForwardSelect', (args) => {
		let kbText = args ? args.text : "";
		multiMode = false;
		commands.jumpForwardSelect(args?.restrictSearch || restrict, args?.putCursorForward || putCursorForward, kbText, multiMode);
	});

	let commandDisposable2m = vscode.commands.registerCommand('jump-and-select.jumpForwardSelectMultiMode', (args) => {
		let kbText = args ? args.text : "";
		multiMode = true;
		commands.jumpForwardSelect(args?.restrictSearch || restrict, args?.putCursorForward || putCursorForward, kbText, multiMode);
	});


	let commandDisposable3 = vscode.commands.registerCommand('jump-and-select.jumpBackward', (args) => {
		let kbText = args ? args.text : "";
		multiMode = false;
		commands.jumpBackward(args?.restrictSearch || restrict, args?.putCursorBackward || putCursorBackward, kbText, multiMode);
	});

	let commandDisposable3m = vscode.commands.registerCommand('jump-and-select.jumpBackwardMultiMode', (args) => {
		let kbText = args ? args.text : "";
		multiMode = true;
		commands.jumpBackward(args?.restrictSearch || restrict, args?.putCursorBackward || putCursorBackward, kbText, multiMode);
	});


	let commandDisposable4 = vscode.commands.registerCommand('jump-and-select.jumpBackwardSelect', (args) => {
		let kbText = args ? args.text : "";
		multiMode = false;
		commands.jumpBackwardSelect(args?.restrictSearch || restrict, args?.putCursorBackward || putCursorBackward, kbText, multiMode);
	});

	let commandDisposable4m = vscode.commands.registerCommand('jump-and-select.jumpBackwardSelectMultiMode', (args) => {
		let kbText = args ? args.text : "";
		multiMode = true;
		commands.jumpBackwardSelect(args?.restrictSearch || restrict, args?.putCursorBackward || putCursorBackward, kbText, multiMode);
	});

	context.subscriptions.push(commandDisposable1, commandDisposable2, commandDisposable3, commandDisposable4);
	context.subscriptions.push(commandDisposable1m, commandDisposable2m, commandDisposable3m, commandDisposable4m);

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {

			// for (let disposable of disposables) {
			// 		disposable.dispose()
			// }

		if (event.affectsConfiguration("jump-and-select.restrictSearch"))    restrict          = _getRestrictSetting();
		if (event.affectsConfiguration("jump-and-select.putCursorForward"))  putCursorForward  = _getCusorPlacementForwardSetting();
		if (event.affectsConfiguration("jump-and-select.putCursorBackward")) putCursorBackward = _getCusorPlacementBackwardSetting();

	}));
}

function _getRestrictSetting() {
	return vscode.workspace.getConfiguration().get("jump-and-select.restrictSearch");
}

function _getCusorPlacementForwardSetting() {
	return vscode.workspace.getConfiguration().get("jump-and-select.putCursorForward");
}

function _getCusorPlacementBackwardSetting() {
	return vscode.workspace.getConfiguration().get("jump-and-select.putCursorBackward");
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
