const vscode = require('vscode');
const commands = require('./commandFunctions');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let restrict =  getRestrictSetting();
	let putCursor    =  getCusorPlacementSetting();

	let commandDisposable1 = vscode.commands.registerCommand('jump-and-select.jumpForwardOnly', () => {
		// console.log(`arg from keybinding = ${arg.text}`);  // works from keybinding
		commands.jumpForward(restrict, putCursor);
	});


	let commandDisposable2 = vscode.commands.registerCommand('jump-and-select.jumpForwardSelect', () => {
		commands.jumpForwardSelect(restrict, putCursor);
	});


	let commandDisposable3 = vscode.commands.registerCommand('jump-and-select.jumpBackwardOnly', () => {
		commands.jumpBackward(restrict, putCursor);
	});


	let commandDisposable4 = vscode.commands.registerCommand('jump-and-select.jumpBackwardSelect', () => {
		commands.jumpBackwardSelect(restrict, putCursor);
	});

	context.subscriptions.push(commandDisposable1, commandDisposable2, commandDisposable3, commandDisposable4);

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
			// for (let disposable of disposables) {
			// 		disposable.dispose()
			// }
		if (event.affectsConfiguration("jump-and-select.restrictToCurrentLine")) restrict = getRestrictSetting();
		if (event.affectsConfiguration("jump-and-select.putCursor")) after = getCusorPlacementSetting();
	}));
}

function getRestrictSetting() {
	return vscode.workspace.getConfiguration().get("jump-and-select.restrictToCurrentLine");
}

function getCusorPlacementSetting() {
	return vscode.workspace.getConfiguration().get("jump-and-select.putCursor");
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
