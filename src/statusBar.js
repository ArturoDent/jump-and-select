const { commands, window, StatusBarAlignment, ThemeColor} = require('vscode');

var global = Function('return this')();  // used for global.typeDisposable
global.statusBarItemVisible = false;


/** @type { import ("vscode").StatusBarItem } */
let sbItem;


/**
 * Create and show a StatusBarItem
 * advising to press 'Return' to exit multiMode
 * 
 * @param {string} direction - going "forward" or "backward" 
 */
exports.show = async function (direction) {
  
  if (sbItem && !global.statusBarItemVisible) {
    sbItem.show();   // one already exists
    global.statusBarItemVisible = true;
  }

  else {
    sbItem = window.createStatusBarItem(StatusBarAlignment.Left, 1);
         
    sbItem.backgroundColor = new ThemeColor('statusBarItem.errorBackground');
    // sbItem.backgroundColor = new ThemeColor('statusBarItem.prominentBackground');  // not supported at all??
    // sbItem.backgroundColor = new ThemeColor('statusBarItem.warningBackground');  // works
    // sbItem.color = new ThemeColor('statusBarItem.prominentForeground');  // only works if neither error/warningBackground
    sbItem.color = new ThemeColor('statusBarItem.errorForeground');
    
    sbItem.command = 'jump-and-select.abortMultiMode';
    sbItem.show();
  }
  
  if (direction === "forward") {
    // sbItem.text = "\u2191 'Return' to exit jump";  // thin arrows
    // sbItem.text = "\u21D3 'Return' to exit jump";  // double arrows
    sbItem.text = "FORWARD - 'Return' to exit jump";
    sbItem.tooltip = "'Return/Enter' will exit the current jump forward";
  }
  else {   // direction === "backward"
    // sbItem.text = "\u2193 'Return' to exit jump";
    // sbItem.text = "\u21D1 'Return' to exit jump";
    sbItem.text = "BACKWARD - 'Return' to exit jump";
    sbItem.tooltip = "'Return/Enter' will exit the current jump backward";
  }
  
  // setContext for command enablement - so abort only shows in Command Palette if sbItem showing
  await commands.executeCommand('setContext', 'jumpAndSelect.statusBarItem.visible', true);
  global.statusBarItemVisible = true;
}


/**
 * Hide the existing StatusBarItem
 */
exports.hide = async function () {
  if (sbItem) sbItem.hide();
  global.statusBarItemVisible = false;
  await commands.executeCommand('setContext', 'jumpAndSelect.statusBarItem.visible', false);
};

/**
 * Dispose the existing StatusBarItem
 */
exports.dispose = async function () {
  if (sbItem) sbItem.hide();
  global.statusBarItemVisible = false;
  sbItem.dispose();
  await commands.executeCommand('setContext', 'jumpAndSelect.statusBarItem.visible', false);
}