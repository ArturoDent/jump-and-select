const vscode = require('vscode');


var global = Function('return this')();  // used for global.typeDisposable
global.statusBarItemVisible = false;


/** @type { vscode.StatusBarItem } */
let sbItem;


/**
 * Create and show a StatusBarItem
 * advising to press 'Return' to exit multiMode
 */
exports.show = async function () {
  
  if (sbItem && !global.statusBarItemVisible) {
    sbItem.show();   // one already exists
    global.statusBarItemVisible = true; 
  }

  else {
    sbItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    sbItem.text = "'Return' to exit jump";
    sbItem.tooltip = "'Return/Enter' will exit the current jump command";
        
    sbItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    // sbItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');  // not supported
    // sbItem.backgroundColor = new vscode.ThemeColor('terminal.ansiWhite');  // doesn't work
    sbItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');  // only works if not errorBackground
  
    sbItem.command = 'jump-and-select.abortMultiMode';
    sbItem.show();
  }
  // setContext for command enablement - so abort only shows in Command Palette if sbItem showing
  await vscode.commands.executeCommand('setContext', 'jumpAndSelect.statusBarItem.visible', true);
  global.statusBarItemVisible = true;
}


/**
 * Hide the existing StatusBarItem
 */
exports.hide = async function () {
  if (sbItem) sbItem.hide();
  global.statusBarItemVisible = false;
  await vscode.commands.executeCommand('setContext', 'jumpAndSelect.statusBarItem.visible', false);
};

/**
 * Dispose the existing StatusBarItem
 */
exports.dispose = async function () {
  if (sbItem) sbItem.hide();
  global.statusBarItemVisible = false;
  sbItem.dispose();
  await vscode.commands.executeCommand('setContext', 'jumpAndSelect.statusBarItem.visible', false);
}