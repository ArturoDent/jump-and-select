const { window, workspace, commands, Uri, DocumentSymbol, Range } = require('vscode');
const { getSettings } = require('./configs');
const { jumpForward, jumpBackward } = require('./commandFunctions');
const { jump2Symbols } = require('./symbols');
const statusBarItem = require('./statusBar');


/** @type { DocumentSymbol[] | undefined } */
globalThis.symbols = [];

/** @type { Range[] } */
globalThis.arrowFunctionRanges = [];

// /** @type { Uri } */
globalThis.currentUri = {};

// /** @type { Boolean } */
globalThis.usesArrowFunctions = false;

globalThis.refreshSymbols = true;

/** @type { import("vscode").Disposable | undefined } */
globalThis.typeDisposable = undefined;

/** @type { boolean } */
globalThis.statusBarItemVisible = false;



/**
 * @param { import ("vscode").ExtensionContext } context
 */
async function activate(context) {

  const document = window.activeTextEditor?.document;

  if (document?.uri) globalThis.currentUri = document.uri;
  if (document?.languageId.match(/javascript|typescript/)) globalThis.usesArrowFunctions = true;

  await commands.executeCommand('setContext', 'jumpAndSelect.statusBarItem.visible', false);

  let settings = await getSettings();

  let commandDisposable1 = commands.registerCommand('jump-and-select.jumpForward', async args => {

    // multiple args like '{ text: "mark", putCursorOnForwardjump: "beforeCharacter", restrictSearch: "line" }
    // no args are required

    if (statusBarItem) await statusBarItem.hide();
    if (globalThis.typeDisposable) await globalThis.typeDisposable.dispose();

    let kbText = args ? args.text : "";  // if args means triggered via a keybinding
    const multiMode = false;
    const select = false;
    const isRegex = args?.isRegex ?? false;

    // check if args.putCursorOnForwardjump is "beforeCharacter" or "afterCharacter"

    // 2 modes of commands: single mode -  one character at a time
    //                      multiMode   -  trigger command, move cursor character by character until command disabled

    jumpForward(
      args?.restrictSearch ?? settings.restrictSearch,
      args?.putCursorOnForwardJump ?? settings.putCursorOnForwardJump,
      kbText,
      multiMode,
      select,
      isRegex,
      false);
  });

  let commandDisposable1m = commands.registerCommand('jump-and-select.jumpForwardMultiMode', async args => {

    if (statusBarItem) await statusBarItem.hide();
    if (globalThis.typeDisposable) await globalThis.typeDisposable.dispose();

    let kbText = args ? args.text : "";  // if args means triggered via a keybinding
    const multiMode = true;
    const select = false;
    const isRegex = args?.isRegex ?? false;

    jumpForward(
      args?.restrictSearch ?? settings.restrictSearch,
      args?.putCursorOnForwardJump ?? settings.putCursorOnForwardJump,
      kbText,
      multiMode,
      select,
      isRegex,
      false);
  });


  let commandDisposable2 = commands.registerCommand('jump-and-select.jumpForwardSelect', async args => {

    if (statusBarItem) await statusBarItem.hide();
    if (globalThis.typeDisposable) await globalThis.typeDisposable.dispose();

    let kbText = args ? args.text : "";
    const multiMode = false;
    const select = true;
    const isRegex = args?.isRegex ?? false;
    const selectMatch = (args?.select ?? 'extends') === 'match';

    jumpForward(
      args?.restrictSearch ?? settings.restrictSearch,
      args?.putCursorOnForwardSelect ?? settings.putCursorOnForwardSelect,
      kbText,
      multiMode,
      select,
      isRegex,
      selectMatch);
  });

  let commandDisposable2m = commands.registerCommand('jump-and-select.jumpForwardSelectMultiMode', async args => {

    if (statusBarItem) await statusBarItem.hide();
    if (globalThis.typeDisposable) await globalThis.typeDisposable.dispose();

    let kbText = args ? args.text : "";
    const multiMode = true;
    const select = true;
    const isRegex = args?.isRegex ?? false;
    const selectMatch = (args?.select ?? 'extends') === 'match';

    jumpForward(
      args?.restrictSearch ?? settings.restrictSearch,
      args?.putCursorOnForwardSelect ?? settings.putCursorOnForwardSelect,
      kbText,
      multiMode,
      select,
      isRegex,
      selectMatch);
  });


  let commandDisposable3 = commands.registerCommand('jump-and-select.jumpBackward', async args => {

    if (statusBarItem) await statusBarItem.hide();
    if (globalThis.typeDisposable) await globalThis.typeDisposable.dispose();

    let kbText = args ? args.text : "";
    const multiMode = false;
    const select = false;
    const isRegex = args?.isRegex ?? false;

    jumpBackward(
      args?.restrictSearch ?? settings.restrictSearch,
      args?.putCursorOnBackwardJump ?? settings.putCursorOnBackwardJump,
      kbText,
      multiMode,
      select,
      isRegex,
      false);
  });

  let commandDisposable3m = commands.registerCommand('jump-and-select.jumpBackwardMultiMode', async args => {

    if (statusBarItem) await statusBarItem.hide();
    if (globalThis.typeDisposable) await globalThis.typeDisposable.dispose();

    let kbText = args ? args.text : "";
    const multiMode = true;
    const select = false;
    const isRegex = args?.isRegex ?? false;

    jumpBackward(
      args?.restrictSearch ?? settings.restrictSearch,
      args?.putCursorOnBackwardJump ?? settings.putCursorOnBackwardJump,
      kbText,
      multiMode,
      select,
      isRegex,
      false);
  });


  let commandDisposable4 = commands.registerCommand('jump-and-select.jumpBackwardSelect', async args => {

    if (statusBarItem) await statusBarItem.hide();
    if (globalThis.typeDisposable) await globalThis.typeDisposable.dispose();

    let kbText = args ? args.text : "";
    const multiMode = false;
    const select = true;
    const isRegex = args?.isRegex ?? false;
    const selectMatch = (args?.select ?? 'extends') === 'match';

    jumpBackward(
      args?.restrictSearch ?? settings.restrictSearch,
      args?.putCursorOnBackwardSelect ?? settings.putCursorOnBackwardSelect,
      kbText,
      multiMode,
      select,
      isRegex,
      selectMatch);
  });

  let commandDisposable4m = commands.registerCommand('jump-and-select.jumpBackwardSelectMultiMode', async args => {

    if (statusBarItem) await statusBarItem.hide();
    if (globalThis.typeDisposable) await globalThis.typeDisposable.dispose();

    let kbText = args ? args.text : "";
    const multiMode = true;
    const select = true;
    const isRegex = args?.isRegex ?? false;
    const selectMatch = (args?.select ?? 'extends') === 'match';

    jumpBackward(
      args?.restrictSearch ?? settings.restrictSearch,
      args?.putCursorOnBackwardSelect ?? settings.putCursorOnBackwardSelect,
      kbText,
      multiMode,
      select,
      isRegex,
      selectMatch);
  });

  context.subscriptions.push(commandDisposable1, commandDisposable2, commandDisposable3, commandDisposable4);
  context.subscriptions.push(commandDisposable1m, commandDisposable2m, commandDisposable3m, commandDisposable4m);

  let abortMultimode = commands.registerCommand('jump-and-select.abortMultiMode', async () => {
    if (statusBarItem) await statusBarItem.hide();
    if (globalThis.typeDisposable) globalThis.typeDisposable.dispose();

    // because focus is lost from the editor when you click the StatusBarItem
    await commands.executeCommand('workbench.action.focusLastEditorGroup');
  });

  context.subscriptions.push(abortMultimode);

  // Consider: turn off multiMode when change file?  make a setting? default to turn off

  let runFunctions = commands.registerCommand('jump-and-select.bySymbol', async (args) => {

    // do we need a multimode ?  multiCursor aware?
    // TODO: still do this?
    if (statusBarItem) await statusBarItem.hide();
    if (globalThis.typeDisposable) globalThis.typeDisposable.dispose();

    // defaults
    if (!!args.symbols && !Array.isArray(args.symbols)) args.symbols = [args.symbols];
    else if (Array.isArray(args.symbols) && args.symbols.length === 0) args.symbols = undefined;

    // default is all symbols
    const kbSymbols = args?.symbols || undefined;

    const kbWhere = args?.where || "nextStart";
    const kbSelect = args?.select || false;

    await jump2Symbols(kbSymbols, kbWhere, kbSelect);
  });
  context.subscriptions.push(runFunctions);

  // if active document has changed or current document was edited
  context.subscriptions.push(workspace.onDidChangeTextDocument(async (event) => {
    // check not keybindings/settings.json
    if (event.contentChanges.length) globalThis.refreshSymbols = true;
  }));

  context.subscriptions.push(workspace.onDidChangeConfiguration(async (event) => {
    if (event.affectsConfiguration("jump-and-select")) settings = await getSettings();
  }));
}


function deactivate() {
  if (statusBarItem) {
    statusBarItem.hide();
    statusBarItem.dispose();
  }
  if (globalThis.typeDisposable) globalThis.typeDisposable.dispose();

  delete globalThis.symbols;
}

module.exports = {
  activate,
  deactivate
};
