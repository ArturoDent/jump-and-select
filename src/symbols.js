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

  // let gS = {
  //   start2Start: Function('vscode', 'generic', `return [new vscode.Selection(generic.range.start, generic.range.start)]`),
  //   end2Start: Function('vscode', 'generic', `return [new vscode.Selection(generic.range.end, generic.range.start)]`),
  //   end2End: Function('vscode', 'generic', `return [new vscode.Selection(generic.range.end, generic.range.end)]`),
  //   start2End: Function('vscode', 'generic', `return [new vscode.Selection(generic.range.start, generic.range.end)]`),
  // }

  let activeSymbol;

  switch (kbWhere) {

    case "previousStart": case "previousEnd":
      activeSymbol = Object.values(globalThis.symbols).findLast(childSymbol => {
        return kbSymbol.some(symbol => (symMap[symbol] === childSymbol.kind) && childSymbol.range.end.isBefore(selection.active));
      });

      // if (activeSymbol && kbWhere === "previousStart") {
      //   if (!kbSelect)
      //     editor.selections = gS.start2Start(vscode, activeSymbol);
      //   else
      //     editor.selections = gS.end2Start(vscode, activeSymbol);
      // }
      // else if (activeSymbol && kbWhere === "previousEnd") {
      //   if (!kbSelect)
      //     // editor.selections = [new vscode.Selection(previousSymbol.range.end, previousSymbol.range.end)];
      //     editor.selections = gS.end2End(vscode, activeSymbol);
      //   else // put cursor at end
      //     // editor.selections = [new vscode.Selection(previousSymbol.range.start, previousSymbol.range.end)];
      //     editor.selections = gS.start2End(vscode, activeSymbol);
      // }
      // else return;
      break;
    
    case "currentStart":  case "currentEnd":  case "parentStart":  case "parentEnd":
      activeSymbol = Object.values(globalThis.symbols).find(childSymbol => {
        // since methods can have classes as parents
        if (kbSymbol.length === 1 && kbSymbol[0] === "method") kbSymbol.push("class");

        // handles when you select beyond the range of a symbol
        const intersection = selection.intersection(childSymbol.range);
        if (intersection) return kbSymbol.some(symbol => symMap[symbol] === childSymbol.kind) && childSymbol.range.contains(intersection);
        else return false;
      });

      if (!activeSymbol) return;

      /** @type {FlatArray<any, Infinity>} */
      let result = [];
      let currentSymbolT;

      if (activeSymbol) result = toArray(activeSymbol, symMap, kbSymbol, selection, result);

      if (result.length && kbWhere.startsWith("current")) {        
        // currentSymbolT = result[0];
        activeSymbol = result[0];
      }
      else if (result.length > 1 && kbWhere.startsWith("parent"))
        // currentSymbolT = result[1];
        activeSymbol = result[1];

      // set genericSymbol to currentSymbolT || currentSymbolTop to simplify below
      // const symbolTarget = currentSymbolT || activeSymbol;
      // activeSymbol = currentSymbolT || activeSymbol;

      // if (kbWhere === "currentStart") {
      //   if (!kbSelect)
      //     // editor.selections = [new vscode.Selection(activeSymbol.range.start, activeSymbol.range.start)];
      //     editor.selections = gS.start2Start(vscode, activeSymbol);
      //   else  // put cursor at start
      //     // editor.selections = [new vscode.Selection(activeSymbol.range.end, activeSymbol.range.start)];
      //     editor.selections = gS.end2Start(vscode, activeSymbol);
      // }
      // else if (kbWhere === "currentEnd") {
      //   if (!kbSelect)
      //     // editor.selections = [new vscode.Selection(activeSymbol.range.end, activeSymbol.range.end)];
      //     editor.selections = gS.end2End(vscode, activeSymbol);
      //   else  // put cursor at start
      //     // editor.selections = [new vscode.Selection(activeSymbol.range.start, activeSymbol.range.end)];
      //     editor.selections = gS.start2End(vscode, activeSymbol);
      // }
      // else if (kbWhere === "parentStart") {
      //   if (!kbSelect)
      //     // editor.selections = [new vscode.Selection(activeSymbol.range.start, activeSymbol.range.start)];
      //     editor.selections = gS.start2Start(vscode, activeSymbol);
      //   else  // put cursor at start
      //     // editor.selections = [new vscode.Selection(activeSymbol.range.end, activeSymbol.range.start)];
      //     editor.selections = gS.end2Start(vscode, activeSymbol);
      // }
      // else if (kbWhere === "parentEnd") {
      //   if (!kbSelect)
      //     // editor.selections = [new vscode.Selection(activeSymbol.range.end, activeSymbol.range.end)];
      //     editor.selections = gS.end2End(vscode, activeSymbol);
      //   else  // put cursor at start
      //     // editor.selections = [new vscode.Selection(activeSymbol.range.start, activeSymbol.range.end)];
      //     editor.selections = gS.start2End(vscode, activeSymbol);
      // }
      break;
    
    case "nextStart": case "nextEnd":
      activeSymbol = Object.values(globalThis.symbols).find(childSymbol => {
        return kbSymbol.some(symbol => symMap[symbol] === childSymbol.kind) && childSymbol.range.start.isAfter(selection.active);
      });
      // if (activeSymbol && kbWhere === "nextStart") {
      //   if (!kbSelect)
      //     // editor.selections = [new vscode.Selection(activeSymbol.range.start, activeSymbol.range.start)];
      //     editor.selections = gS.start2Start(vscode, activeSymbol);
      //   else  // put cursor at start
      //     // editor.selections = [new vscode.Selection(activeSymbol.range.end, activeSymbol.range.start)];
      //     editor.selections = gS.end2Start(vscode, activeSymbol);
      // }
      // else  if (activeSymbol && kbWhere === "nextEnd") {
      //   if (!kbSelect)
      //     // editor.selections = [new vscode.Selection(activeSymbol.range.end, activeSymbol.range.end)];
      //     editor.selections = gS.end2End(vscode, activeSymbol);
      //   else  // put cursor at end
      //     // editor.selections = [new vscode.Selection(activeSymbol.range.start, activeSymbol.range.end)];
      //     editor.selections = gS.start2End(vscode, activeSymbol);
      // }
      break;
    
    case "topScopeStart": case "topScopeEnd":
      activeSymbol = Object.values(globalThis.symbols).find(childSymbol => {
        return kbSymbol.some(symbol => symMap[symbol] === childSymbol.kind) && childSymbol.range.contains(selection.active);
      });
      // if (activeSymbol && kbWhere === "topScopeStart") {
      //   if (!kbSelect)
      //     // editor.selections = [new vscode.Selection(topSymbol.range.start, topSymbol.range.start)];
      //     editor.selections = gS.start2Start(vscode, activeSymbol);
      //   else  // put cursor at start
      //     // editor.selections = [new vscode.Selection(topSymbol.range.end, topSymbol.range.start)];
      //     editor.selections = gS.end2Start(vscode, activeSymbol);
      // }
      // else  if (activeSymbol && kbWhere === "topScopeEnd") {
      //   if(!kbSelect)
      //     // editor.selections = [new vscode.Selection(topSymbol.range.end, topSymbol.range.end)];
      //     editor.selections = gS.end2End(vscode, activeSymbol);
      //   else  // put cursor at end
      //     // editor.selections = [new vscode.Selection(topSymbol.range.start, topSymbol.range.end)];
      //     editor.selections = gS.start2End(vscode, activeSymbol);
      // }
      break;
    
    default:      
      break;
  }

  if (!activeSymbol) return;

  let gS = {
    start2Start: Function('vscode', 'generic', `return [new vscode.Selection(generic.range.start, generic.range.start)]`),
    end2Start: Function('vscode', 'generic', `return [new vscode.Selection(generic.range.end, new vscode.Position(generic.range.start.line, 0))]`),
    end2End: Function('vscode', 'generic', `return [new vscode.Selection(generic.range.end, generic.range.end)]`),
    start2End: Function('vscode', 'generic', `return [new vscode.Selection(new vscode.Position(generic.range.start.line, 0), generic.range.end)]`),
  };

  if (kbWhere.endsWith("Start")) {  // cursor goes to the start of the symbol
    if (!kbSelect)
      editor.selections = gS.start2Start(vscode, activeSymbol);
    else
      editor.selections = gS.end2Start(vscode, activeSymbol);
  }
  else if (kbWhere.endsWith("End")) {  // cursor goes to the end of the symbol
    if (!kbSelect)
      editor.selections = gS.end2End(vscode, activeSymbol);
    else
      editor.selections = gS.start2End(vscode, activeSymbol);
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