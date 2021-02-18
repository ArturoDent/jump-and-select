const vscode = require('vscode');
const commands = require('./commandFunctions');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let commandDisposable1 = vscode.commands.registerCommand('jump-and-select.jumpForwardOnly', () => {
		commands.jumpForward();
	});


	let commandDisposable2 = vscode.commands.registerCommand('jump-and-select.jumpForwardSelect', () => {
		commands.jumpForwardSelect();
	});


	let commandDisposable3 = vscode.commands.registerCommand('jump-and-select.jumpBackwardOnly', () => {
		commands.jumpBackward();
	});


	let commandDisposable4 = vscode.commands.registerCommand('jump-and-select.jumpBackwardSelect', () => {
		commands.jumpBackwardSelect();
	});

	context.subscriptions.push(commandDisposable1, commandDisposable2, commandDisposable3, commandDisposable4);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
