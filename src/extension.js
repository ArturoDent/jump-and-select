const vscode = require('vscode');
const commands = require('./commandFunctions');
// const providers = require('./completionProvider');
const statusBarItem = require('./statusBar');

var global = Function('return this')();  // used for global.typeDisposable


/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  
  await vscode.commands.executeCommand('setContext', 'jumpAndSelect.statusBarItem.visible', false);

	let restrict             =   _getRestrictSetting();
	let putCursorForward     =   _getCusorPlacementForwardSetting();
	let putCursorBackward    =   _getCusorPlacementBackwardSetting();

  // providers.makeKeybindingsCompletionProvider(context);

	let commandDisposable1 = vscode.commands.registerCommand('jump-and-select.jumpForward', async args => {

		// multiple args like '{ text: "mark", putCursorForward: "beforeCharacter",
    //											 putCursorBackward: "beforeCharacter", "restrictSearch": "line" }
    
    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) await global.typeDisposable.dispose();

		let kbText = args ? args.text : "";  // if args means triggered via a keybinding
    const multiMode = false;
    const select = false;

		// check if args.putCursorForward is "beforeCharacter" or "afterCharacter"

		// 2 modes of commands: single mode -  one character at a time
		//                      multiMode   -  trigger command, move cursor character by character until command disabled

		commands.jumpForward(
			args?.restrictSearch || restrict, args?.putCursorForward || putCursorForward, kbText, multiMode, select);
	});

  let commandDisposable1m = vscode.commands.registerCommand('jump-and-select.jumpForwardMultiMode', async args => {
    
    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) await global.typeDisposable.dispose();
    
		let kbText = args ? args.text : "";  // if args means triggered via a keybinding
    const multiMode = true;
    const select = false;
    
		commands.jumpForward(args?.restrictSearch || restrict, args?.putCursorForward || putCursorForward, kbText, multiMode, select);
	});


  let commandDisposable2 = vscode.commands.registerCommand('jump-and-select.jumpForwardSelect', async args => {
    
    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) await global.typeDisposable.dispose();
    
		let kbText = args ? args.text : "";
    const multiMode = false;
    const select = true;
    
		// commands.jumpForwardSelect(args?.restrictSearch || restrict, args?.putCursorForward || putCursorForward, kbText, multiMode, select);
		commands.jumpForward(args?.restrictSearch || restrict, args?.putCursorForward || putCursorForward, kbText, multiMode, select);
	});

  let commandDisposable2m = vscode.commands.registerCommand('jump-and-select.jumpForwardSelectMultiMode', async args => {
    
    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) await global.typeDisposable.dispose();
    
		let kbText = args ? args.text : "";
    const multiMode = true;
    const select = true;
    
		// commands.jumpForwardSelect(args?.restrictSearch || restrict, args?.putCursorForward || putCursorForward, kbText, multiMode, select);
		commands.jumpForward(args?.restrictSearch || restrict, args?.putCursorForward || putCursorForward, kbText, multiMode, select);
	});


  let commandDisposable3 = vscode.commands.registerCommand('jump-and-select.jumpBackward', async args => {
    
    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) await global.typeDisposable.dispose();
    
		let kbText = args ? args.text : "";
    const multiMode = false;
    const select = false;
    
		commands.jumpBackward(args?.restrictSearch || restrict, args?.putCursorBackward || putCursorBackward, kbText, multiMode, select);
	});

  let commandDisposable3m = vscode.commands.registerCommand('jump-and-select.jumpBackwardMultiMode', async args => {
    
    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) await global.typeDisposable.dispose();
    
		let kbText = args ? args.text : "";
    const multiMode = true;
    const select = false;
    
		commands.jumpBackward(args?.restrictSearch || restrict, args?.putCursorBackward || putCursorBackward, kbText, multiMode, select);
	});


  let commandDisposable4 = vscode.commands.registerCommand('jump-and-select.jumpBackwardSelect', async args => {
    
    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) await global.typeDisposable.dispose();
    
		let kbText = args ? args.text : "";
    const multiMode = false;
    const select = true;
    
		commands.jumpBackward(args?.restrictSearch || restrict, args?.putCursorBackward || putCursorBackward, kbText, multiMode, select);
    // commands.jumpBackwardSelect(args?.restrictSearch || restrict, args?.putCursorBackward || putCursorBackward, kbText, multiMode, select);
	});

  let commandDisposable4m = vscode.commands.registerCommand('jump-and-select.jumpBackwardSelectMultiMode', async args => {
    
    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) await global.typeDisposable.dispose();
    
		let kbText = args ? args.text : "";
    const multiMode = true;
    const select = true;
    
		// commands.jumpBackwardSelect(args?.restrictSearch || restrict, args?.putCursorBackward || putCursorBackward, kbText, multiMode, select);
		commands.jumpBackward(args?.restrictSearch || restrict, args?.putCursorBackward || putCursorBackward, kbText, multiMode, select);
	});

	context.subscriptions.push(commandDisposable1, commandDisposable2, commandDisposable3, commandDisposable4);
  context.subscriptions.push(commandDisposable1m, commandDisposable2m, commandDisposable3m, commandDisposable4m);
  
  let abortMultimode = vscode.commands.registerCommand('jump-and-select.abortMultiMode', async () => {
    if (statusBarItem) await statusBarItem.hide();
    global.typeDisposable.dispose();
    
    // focus is lost from the editor when you click the StatusBarItem
    await vscode.commands.executeCommand('workbench.action.focusLastEditorGroup');
  });
  
  context.subscriptions.push(abortMultimode);  
  
  // TODO: trun off multiMode when change file?  make a setting? default to turn off

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {

		if (event.affectsConfiguration("jump-and-select.restrictSearch"))    restrict          = _getRestrictSetting();
		if (event.affectsConfiguration("jump-and-select.putCursorForward"))  putCursorForward  = _getCusorPlacementForwardSetting();
		if (event.affectsConfiguration("jump-and-select.putCursorBackward")) putCursorBackward = _getCusorPlacementBackwardSetting();

	}));
}

// TODO simplify getting the settings ?
function _getRestrictSetting() {
  return vscode.workspace.getConfiguration().get("jump-and-select.restrictSearch");
	// return vscode.workspace.getConfiguration("jump-and-select").get("restrictSearch");
}

function _getCusorPlacementForwardSetting() {
	return vscode.workspace.getConfiguration().get("jump-and-select.putCursorForward");
}

function _getCusorPlacementBackwardSetting() {
	return vscode.workspace.getConfiguration().get("jump-and-select.putCursorBackward");
}

function deactivate() {
  if (statusBarItem) {
    statusBarItem.hide();
    statusBarItem.dispose();
  }
  if (global.typeDisposable) global.typeDisposable.dispose();
}

module.exports = {
	activate,
	deactivate
}
