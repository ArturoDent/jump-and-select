const vscode = require('vscode');
const commands = require('./commandFunctions');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let restrict             =   _getRestrictSetting();
	let putCursorForward     =   _getCusorPlacementForwardSetting();
	let putCursorBackward    =   _getCusorPlacementBackwardSetting();


	let commandDisposable1 = vscode.commands.registerCommand('jump-and-select.jumpForward', (args) => {

		// multiple args like '{ text: "mark", putCursorForward: "beforeCharacter",
		//											 putCursorBackward: "beforeCharacter", "restrictToCurrentLine": true }

		let kbText = args ? args.text : "";  // if args means triggered via a keybinding

		// check if args.putCursorForward and no args.putCursorBackward
		// check if args.putCursorForward is "beforeCharacter" or "afterCharacter"

		commands.jumpForward(args?.restrictToCurrentLine || restrict, args?.putCursorForward || putCursorForward, kbText);
	});


	let commandDisposable2 = vscode.commands.registerCommand('jump-and-select.jumpForwardSelect', (args) => {
		let kbText = args ? args.text : "";
		commands.jumpForwardSelect(args?.restrictToCurrentLine || restrict, args?.putCursorForward || putCursorForward, kbText);
	});


	let commandDisposable3 = vscode.commands.registerCommand('jump-and-select.jumpBackward', (args) => {
		let kbText = args ? args.text : "";
		commands.jumpBackward(args?.restrictToCurrentLine || restrict, args?.putCursorBackward || putCursorBackward, kbText);
	});


	let commandDisposable4 = vscode.commands.registerCommand('jump-and-select.jumpBackwardSelect', (args) => {
		let kbText = args ? args.text : "";
		commands.jumpBackwardSelect(args?.restrictToCurrentLine || restrict, args?.putCursorBackward || putCursorBackward, kbText);
	});

	context.subscriptions.push(commandDisposable1, commandDisposable2, commandDisposable3, commandDisposable4);

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
			// for (let disposable of disposables) {
			// 		disposable.dispose()
			// }
		if (event.affectsConfiguration("jump-and-select.restrictToCurrentLine")) restrict = _getRestrictSetting();
		if (event.affectsConfiguration("jump-and-select.putCursorForward")) putCursorForward = _getCusorPlacementForwardSetting();
		if (event.affectsConfiguration("jump-and-select.putCursorBackward")) putCursorBackward = _getCusorPlacementBackwardSetting();

	}));
}

function _getRestrictSetting() {
	return vscode.workspace.getConfiguration().get("jump-and-select.restrictToCurrentLine");
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
