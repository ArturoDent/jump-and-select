const vscode = require('vscode');
const commands = require('./commandFunctions');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let restrict =  getRestrictSetting();
	let putCursorForward = getCusorPlacementForwardSetting();
	let putCursorBackward    =  getCusorPlacementBackwardSetting();


	let commandDisposable1 = vscode.commands.registerCommand('jump-and-select.jumpForwardOnly', (arg) => {
		let kbARG = arg ? arg.text : "";  // if arg means triggered via a keybinding
		commands.jumpForward(restrict, putCursorForward, kbARG);
	});


	let commandDisposable2 = vscode.commands.registerCommand('jump-and-select.jumpForwardSelect', () => {
		commands.jumpForwardSelect(restrict, putCursorForward);
	});


	let commandDisposable3 = vscode.commands.registerCommand('jump-and-select.jumpBackwardOnly', () => {
		commands.jumpBackward(restrict, putCursorBackward);
	});


	let commandDisposable4 = vscode.commands.registerCommand('jump-and-select.jumpBackwardSelect', () => {
		commands.jumpBackwardSelect(restrict, putCursorBackward);
	});

	context.subscriptions.push(commandDisposable1, commandDisposable2, commandDisposable3, commandDisposable4);

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
			// for (let disposable of disposables) {
			// 		disposable.dispose()
			// }
		if (event.affectsConfiguration("jump-and-select.restrictToCurrentLine")) restrict = getRestrictSetting();
		if (event.affectsConfiguration("jump-and-select.putCursorForward")) putCursorForward = getCusorPlacementForwardSetting();
		if (event.affectsConfiguration("jump-and-select.putCursorBackward")) putCursorBackward = getCusorPlacementBackwardSetting();

	}));
}

function getRestrictSetting() {
	return vscode.workspace.getConfiguration().get("jump-and-select.restrictToCurrentLine");
}

function getCusorPlacementForwardSetting() {
	return vscode.workspace.getConfiguration().get("jump-and-select.putCursorForward");
}

function getCusorPlacementBackwardSetting() {
	return vscode.workspace.getConfiguration().get("jump-and-select.putCursorBackward");
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
