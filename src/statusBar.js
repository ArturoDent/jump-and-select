const vscode = require('vscode');

/** @type { vscode.StatusBarItem } */
let sbItem;

/**
 * Create and show a StatusBarItem
 * advising to press 'Return' to exit multiMode
 */
exports.show = async function () {
  
  if (sbItem) sbItem.show();   // one already exists

  else {
    sbItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    sbItem.text = "Press 'Return' to exit jump";
    sbItem.tooltip = "'Return/Enter' will exit the current jump command";
    
    sbItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    // sbItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');  // not supported
    // sbItem.backgroundColor = new vscode.ThemeColor('terminal.ansiWhite');  // doesn't work
    sbItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');  // only works if not errorBackground
  
    sbItem.command = 'jump-and-select.abortMultiMode';
    sbItem.show();
  }
  await vscode.commands.executeCommand('setContext', 'jumpAndSelect.statusBarItem.visible', true);
}


/**
 * Hide the existing StatusBarItem
 */
exports.hide = async function () {
  if (sbItem) sbItem.hide();
  await vscode.commands.executeCommand('setContext', 'jumpAndSelect.statusBarItem.visible', false);
};

/**
 * Dispose the existing StatusBarItem
 */
exports.dispose = async function () {
  if (sbItem) sbItem.hide();
  sbItem.dispose();
  await vscode.commands.executeCommand('setContext', 'jumpAndSelect.statusBarItem.visible', false);
}