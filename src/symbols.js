const vscode = require('vscode');

/**
 * @typedef  {Object} SymMap
 * @property {vscode.SymbolKind} function
 * @property {vscode.SymbolKind} class
 * @property {vscode.SymbolKind} method
 */
/** @typedef {"function"|"class"|"method"}  SymMapKey */

/** @type {SymMap} */
const symMap = {
  function: vscode.SymbolKind.Function,
  class: vscode.SymbolKind.Class,
  method: vscode.SymbolKind.Method
}


/** 
 * @param {SymMapKey[]} kbSymbol
 * @param {string} kbWhere
 * @param {boolean} kbSelect
 */
exports.jump2Symbols = async function (kbSymbol, kbWhere, kbSelect = false) {
  
  if (!kbSymbol || !kbWhere) return;  // notification?

  const editor = vscode.window.activeTextEditor;
  const document = editor?.document;
  let   selection = vscode.window.activeTextEditor?.selection;
  if (!document || !selection) return;

  // if active document has changed or current document was edited
  if (globalThis.refreshSymbols || globalThis.currentUri !== document.uri) {
    globalThis.symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
    globalThis.refreshSymbols = false;
    globalThis.currentUri = document.uri;
  }

  if (!globalThis.symbols) return;

  let targetSymbol;

  switch (kbWhere) {

    case "previousStart": case "previousEnd":
      targetSymbol = Object.values(globalThis.symbols).findLast(childSymbol => {
        return kbSymbol.some(symbol => (symMap[symbol] === childSymbol.kind) && childSymbol.range.end.isBefore(selection.active));
      });
      break;
    
    case "currentStart":  case "currentEnd":  case "parentStart":  case "parentEnd":
      targetSymbol = Object.values(globalThis.symbols).find(childSymbol => {
        // since methods can have classes as parents
        if (kbSymbol.length === 1 && kbSymbol[0] === "method") kbSymbol.push("class");

        // handles when you select beyond the range of a symbol
        const intersection = selection.intersection(childSymbol.range);
        if (intersection) return kbSymbol.some(symbol => symMap[symbol] === childSymbol.kind) && childSymbol.range.contains(intersection);
        else return false;
      });

      if (!targetSymbol) return;

      /** @type {FlatArray<any, Infinity>} */
      let result = [];

      if (targetSymbol) result = toArray(targetSymbol, symMap, kbSymbol, selection, result);

      if (result.length && kbWhere.startsWith("current")) {        
        targetSymbol = result[0];
      }
      else if (result.length > 1 && kbWhere.startsWith("parent"))
        targetSymbol = result[1];
      break;
    
    case "nextStart": case "nextEnd":
      targetSymbol = Object.values(globalThis.symbols).find(childSymbol => {
        return kbSymbol.some(symbol => symMap[symbol] === childSymbol.kind) && childSymbol.range.start.isAfter(selection.active);
      });
      break;
    
    case "topScopeStart": case "topScopeEnd":
      targetSymbol = Object.values(globalThis.symbols).find(childSymbol => {
        // childSymbol.kind === vscode.SymbolKind.Function
        return kbSymbol.some(symbol => symMap[symbol] === childSymbol.kind) && childSymbol.range.contains(selection.active);
      });
      break;
    
    default:      
      break;
  }

  if (!targetSymbol) return;

  let gS = {
    start2Start: Function('vscode', 'generic', `return [new vscode.Selection(generic.range.start, generic.range.start)]`),
    end2Start: Function('vscode', 'generic', `return [new vscode.Selection(generic.range.end, new vscode.Position(generic.range.start.line, 0))]`),
    end2End: Function('vscode', 'generic', `return [new vscode.Selection(generic.range.end, generic.range.end)]`),
    start2End: Function('vscode', 'generic', `return [new vscode.Selection(new vscode.Position(generic.range.start.line, 0), generic.range.end)]`),
  };

  if (kbWhere.endsWith("Start")) {  // cursor goes to the start of the symbol
    if (!kbSelect)
      editor.selections = gS.start2Start(vscode, targetSymbol);
    else
      editor.selections = gS.end2Start(vscode, targetSymbol);
  }
  else if (kbWhere.endsWith("End")) {  // cursor goes to the end of the symbol
    if (!kbSelect)
      editor.selections = gS.end2End(vscode, targetSymbol);
    else
      editor.selections = gS.start2End(vscode, targetSymbol);
  }
  else return;

  if (kbWhere.endsWith('Start'))
    editor.revealRange(new vscode.Range(editor.selections[0].start, editor.selections[0].start), vscode.TextEditorRevealType.Default); // Default = 0, as little scrolling as necessary
  else  // reveal the End for "...End" options
    editor.revealRange(new vscode.Range(editor.selections[0].end, editor.selections[0].end), vscode.TextEditorRevealType.Default); // Default = 0, as little scrolling as necessary
};


/** 
 * @param {vscode.DocumentSymbol} parent
 * @param {SymMap} symMap
 * @param {SymMapKey[]} kbSymbol
 * @param {vscode.Selection} selection
 * @param {vscode.DocumentSymbol[]} result
 * @returns {FlatArray<any, Infinity>}
 */
function toArray(parent, symMap, kbSymbol, selection, result) {

  for (const child of parent.children) {
    if (child.children.length) {
      const intersection = selection?.intersection(child.range);
      if (intersection && kbSymbol.some(symbol => symMap[symbol] === child.kind) && child.range.contains(intersection)) {
        toArray(child, symMap, kbSymbol, selection, result);

      }
    }
    const intersection = selection?.intersection(child.range);
    if (intersection && kbSymbol.some(symbol => symMap[symbol] === child.kind) && child.range.contains(intersection)) {
      result.push(child);
    }
  }
  return result.flat(Infinity);
}