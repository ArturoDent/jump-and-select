const { window, workspace, commands, Uri, DocumentSymbol } = require('vscode');
const { getSettings } = require('./configs');
const { jumpForward, jumpBackward } = require('./commandFunctions');
const { jump2Symbols } = require('./symbols');
const statusBarItem = require('./statusBar');

var global = Function('return this')();  // used for global.typeDisposable

/** @type {DocumentSymbol[]|undefined} */
globalThis.symbols = [];

// /** @type {Uri} */
// globalThis.currentUri = Uri.file("");
globalThis.currentUri = {};

globalThis.refreshSymbols = true;



/**
 * @param {import ("vscode").ExtensionContext} context
 */
async function activate(context) {

  if (window.activeTextEditor?.document.uri) globalThis.currentUri = window.activeTextEditor?.document.uri;

  await commands.executeCommand('setContext', 'jumpAndSelect.statusBarItem.visible', false);

  let settings = await getSettings();

	let commandDisposable1 = commands.registerCommand('jump-and-select.jumpForward', async args => {

    // multiple args like '{ text: "mark", putCursorOnForwardJump: "beforeCharacter", restrictSearch: "line" }
    // no args are required

    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) await global.typeDisposable.dispose();

		let kbText = args ? args.text : "";  // if args means triggered via a keybinding
    const multiMode = false;
    const select = false;

		// check if args.putCursorOnForwardJump is "beforeCharacter" or "afterCharacter"

		// 2 modes of commands: single mode -  one character at a time
		//                      multiMode   -  trigger command, move cursor character by character until command disabled

		jumpForward(
      args?.restrictSearch ?? settings.restrictSearch,
      args?.putCursorOnForwardJump ?? settings.putCursorOnForwardJump,
      kbText,
      multiMode,
      select);
	});

  let commandDisposable1m = commands.registerCommand('jump-and-select.jumpForwardMultiMode', async args => {

    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) await global.typeDisposable.dispose();

		let kbText = args ? args.text : "";  // if args means triggered via a keybinding
    const multiMode = true;
    const select = false;

    jumpForward(
      args?.restrictSearch ?? settings.restrictSearch,
      args?.putCursorOnForwardJump ?? settings.putCursorOnForwardJump,
      kbText,
      multiMode,
      select);
	});


  let commandDisposable2 = commands.registerCommand('jump-and-select.jumpForwardSelect', async args => {

    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) await global.typeDisposable.dispose();

		let kbText = args ? args.text : "";
    const multiMode = false;
    const select = true;

    jumpForward(
      args?.restrictSearch ?? settings.restrictSearch,
      args?.putCursorOnForwardSelect ?? settings.putCursorOnForwardSelect,
      kbText,
      multiMode,
      select);
	});

  let commandDisposable2m = commands.registerCommand('jump-and-select.jumpForwardSelectMultiMode', async args => {

    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) await global.typeDisposable.dispose();

		let kbText = args ? args.text : "";
    const multiMode = true;
    const select = true;

    jumpForward(
      args?.restrictSearch ?? settings.restrictSearch,
      args?.putCursorOnForwardSelect ?? settings.putCursorOnForwardSelect,
      kbText,
      multiMode,
      select);
	});


  let commandDisposable3 = commands.registerCommand('jump-and-select.jumpBackward', async args => {

    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) await global.typeDisposable.dispose();

		let kbText = args ? args.text : "";
    const multiMode = false;
    const select = false;

    jumpBackward(
      args?.restrictSearch ?? settings.restrictSearch,
      args?.putCursorOnBackwardJump ?? settings.putCursorOnBackwardJump,
      kbText,
      multiMode,
      select);
	});

  let commandDisposable3m = commands.registerCommand('jump-and-select.jumpBackwardMultiMode', async args => {

    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) await global.typeDisposable.dispose();

		let kbText = args ? args.text : "";
    const multiMode = true;
    const select = false;

    jumpBackward(
      args?.restrictSearch ?? settings.restrictSearch,
      args?.putCursorOnBackwardJump ?? settings.putCursorOnBackwardJump,
      kbText,
      multiMode,
      select);
	});


  let commandDisposable4 = commands.registerCommand('jump-and-select.jumpBackwardSelect', async args => {

    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) await global.typeDisposable.dispose();

		let kbText = args ? args.text : "";
    const multiMode = false;
    const select = true;

    jumpBackward(
      args?.restrictSearch ?? settings.restrictSearch,
      args?.putCursorOnBackwardSelect ?? settings.putCursorOnBackwardSelect,
      kbText,
      multiMode,
      select);
	});

  let commandDisposable4m = commands.registerCommand('jump-and-select.jumpBackwardSelectMultiMode', async args => {

    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) await global.typeDisposable.dispose();

		let kbText = args ? args.text : "";
    const multiMode = true;
    const select = true;

    jumpBackward(
      args?.restrictSearch ?? settings.restrictSearch,
      args?.putCursorOnBackwardSelect ?? settings.putCursorOnBackwardSelect,
      kbText,
      multiMode,
      select);
	});

	context.subscriptions.push(commandDisposable1, commandDisposable2, commandDisposable3, commandDisposable4);
  context.subscriptions.push(commandDisposable1m, commandDisposable2m, commandDisposable3m, commandDisposable4m);

  let abortMultimode = commands.registerCommand('jump-and-select.abortMultiMode', async () => {
    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) global.typeDisposable.dispose();

    // because focus is lost from the editor when you click the StatusBarItem
    await commands.executeCommand('workbench.action.focusLastEditorGroup');
  });

  context.subscriptions.push(abortMultimode);

  // Consider: turn off multiMode when change file?  make a setting? default to turn off

  let runFunctions = commands.registerCommand('jump-and-select.bySymbol', async (args) => {

    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) global.typeDisposable.dispose();

    // defaults
    const kbSymbol = args ? args.symbol : [];      // ["function", "class"]   method too ?
    const kbWhere = args ? args.where : "";        // "nextTop"
    const kbSelect = args ? args.select : false;

    await jump2Symbols(kbSymbol, kbWhere, kbSelect);

  });
  context.subscriptions.push(runFunctions);

  context.subscriptions.push(workspace.onDidChangeTextDocument(async (event) => {
    globalThis.refreshSymbols = true;
  }));

  // context.subscriptions.push(window.onDidChangeActiveTextEditor(async (event) => {
  //   if (event) globalThis.currentUri = event.document.uri;
  //   // globalThis.refreshSymbols = true;
  // }));

  context.subscriptions.push(workspace.onDidChangeConfiguration(async (event) => {
    if (event.affectsConfiguration("jump-and-select")) settings = await getSettings();
	}));
}


function deactivate() {
  if (statusBarItem) {
    statusBarItem.hide();
    statusBarItem.dispose();
  }
  if (global.typeDisposable) global.typeDisposable.dispose();
  delete globalThis.symbols;
  // delete globalThis?.currentUri;
  // delete globalThis?.refreshSymbols;
}

module.exports = {
	activate,
	deactivate
}
