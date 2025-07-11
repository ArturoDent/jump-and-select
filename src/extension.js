const { window, workspace, commands, Uri, DocumentSymbol, Range } = require('vscode');
const { getSettings } = require('./configs');
const { jumpForward, jumpBackward } = require('./commandFunctions');
const { jump2Symbols } = require('./symbols');
const statusBarItem = require('./statusBar');


var global = Function('return this')();  // used for global.typeDisposable

/** @type { DocumentSymbol[] | undefined } */
globalThis.symbols = [];

/** @type { Range[] } */
globalThis.arrowFunctionRanges = [];

// /** @type { Uri } */
globalThis.currentUri = {};

// /** @type { Boolean } */
globalThis.usesArrowFunctions = false;

globalThis.refreshSymbols = true;



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
    if (global.typeDisposable) await global.typeDisposable.dispose();

    let kbText = args ? args.text : "";  // if args means triggered via a keybinding
    const multiMode = false;
    const select = false;

    // check if args.putCursorOnForwardjump is "beforeCharacter" or "afterCharacter"

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

    // do we need a multimode ?  multiCursor aware?
    // TODO: still do this?
    if (statusBarItem) await statusBarItem.hide();
    if (global.typeDisposable) global.typeDisposable.dispose();

    // /** @type { any } */
    // const bad = checkArgs(structuredClone(args));

    // if (bad && Object.keys(bad).length) {  // not empty
    //   console.log(bad);

    //   let message = "";
    //   if (bad.symbol.length === 1)
    //     message += `The "symbol" option "${bad.symbol[0]}" is an error. `;
    //   else if (bad.symbol.length > 1)
    //     message += `The "symbol" options "${bad.symbol.join('" and "')}" are errors. `;
    //   if (bad.where)
    //     message += `The "where" option "${bad.where}" is an error. `;
    //   if (bad.select)
    //     message += `The "select" option "${bad.select}" is not allowed. "select" must be a boolean.`;


    //   return await window.showErrorMessage(
    //     message,
    //     {modal: true},
    //     ...['Go to keybindings'])   // two buttons - Cancel will be added
    //     .then(selected => {
    //       if (selected === 'Go to keybindings') commands.executeCommand('workbench.action.openGlobalKeybindingsFile');
    //       // any way to navigate to this particular keybinding?
    //       // Opening a file at a specific line and column: vscode:;//file/{full-path-to-file}:{line}:{column}

    //       else commands.executeCommand('leaveEditorMessage');
    //     });
    // }

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

// /**
//  * 
//  * @param { Object }           args
//  * @param { string | string[] }    args.symbol
//  * @param { string }             args.where
//  * @param { boolean }            args.select
//  * 
//  * @returns { Object }    bad
//  * @property { string[] }   [symbol]
//  * @property { string }     [where]
//  * @property { string }     [select]
//  */
// function checkArgs(args) {

//   /** @type {{ symbol: string[], where: string, select: boolean|string }} */
//   let bad = {};

//   if (!Array.isArray(args.symbol))
//     args.symbol = [args.symbol];

//   const symbols = ["class", "method", "function"];
//   const wheres = [
//     "previousStart", "previousEnd", "currentStart", "currentEnd", "nextStart",
//     "nextEnd", "parentStart", "parentEnd", "childStart", "childEnd",
//     "topScopeStart", "topScopeEnd"
//   ];

//   let /** @type { string[] } */ badSymbol = [];

//   if (!!args.symbol && args.symbol[0] !== undefined) badSymbol = args.symbol.filter(kbSymbol => !symbols.includes(kbSymbol));
//   if (badSymbol.length) bad.symbol = badSymbol;

//   if (!!args.where && !wheres.includes(args.where)) bad.where = args.where;

//   if (!!args.select && typeof args.select !== "boolean") bad.select = args.select;

//   return bad;
// }


function deactivate() {
  if (statusBarItem) {
    statusBarItem.hide();
    statusBarItem.dispose();
  }
  if (global.typeDisposable) global.typeDisposable.dispose();

  delete globalThis.symbols;
}

module.exports = {
  activate,
  deactivate
};
