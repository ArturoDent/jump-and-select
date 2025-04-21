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
};


/** 
 * @param {SymMapKey[]} kbSymbol
 * @param {string} kbWhere
 * @param {boolean} kbSelect
 */
exports.jump2Symbols = async function (kbSymbol, kbWhere, kbSelect = false) {

  if (!kbSymbol || !kbWhere) return;  // notification?

  const editor = vscode.window.activeTextEditor;
  const document = editor?.document;
  let selection = vscode.window.activeTextEditor?.selection;
  if (!document || !selection) return;

  // if active document has changed or current document was edited
  if (globalThis.refreshSymbols || globalThis.currentUri !== document.uri) {
    globalThis.symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
    globalThis.refreshSymbols = false;
    globalThis.currentUri = document.uri;
  }

  if (!globalThis.symbols?.length) return;

  let parentSymbol, targetSymbol;

  /** @type {FlatArray<any, Infinity>} */
  let result = [];

  switch (kbWhere) {

    case "previousStart": case "previousEnd":

      parentSymbol = Object.values(globalThis.symbols).find(topSymbol => {
        return topSymbol.range.contains(selection.active);
      });
      if (!parentSymbol) return;

      if (parentSymbol.children.length) result = deepSymbolRecursion(parentSymbol, kbWhere, symMap, kbSymbol, selection, result, document);

      if (result.length) targetSymbol = result.at(-1);
      break;

    case "currentStart": case "currentEnd": case "parentStart": case "parentEnd":

      parentSymbol = Object.values(globalThis.symbols).find(topSymbol => {

        // handles when you select before or beyond the range of a symbol, but same start/end lines
        const parentExtendedRange = extendSelection(topSymbol, kbWhere, document);
        if (parentExtendedRange.contains(selection.active)) return true;
        else return false;
      });

      if (!parentSymbol) return;

      if (parentSymbol) result = deepSymbolRecursion(parentSymbol, kbWhere, symMap, kbSymbol, selection, result, document);

      // check if it is in the parent (but wasn't in any children)
      if (!result.length) {
        const parentExtendedRange = extendSelection(parentSymbol, kbWhere, document);
        if (parentExtendedRange.contains(selection.active))
          result.push(parentSymbol);
      }

      // for parentStart/parentEnd
      // result[] = deepestChild, deepestParent, nextDeepestChild(= deepestParent), nextDeepestParent, etc.

      if (result.length && kbWhere.startsWith("current")) {   // could be combined with parent if !result.push(child) below
        targetSymbol = result[0];
      }
      else if (result.length > 1 && kbWhere.startsWith("parent"))  // == deepestParent of the deepestChild
        targetSymbol = result[1];
      break;

    case "nextStart": case "nextEnd":

      parentSymbol = Object.values(globalThis.symbols).find(topSymbol => {
        return topSymbol.range.contains(selection.active);
      });

      if (!parentSymbol) return;

      if (parentSymbol.children.length) result = deepSymbolRecursion(parentSymbol, kbWhere, symMap, kbSymbol, selection, result, document);

      if (result.length) targetSymbol = result[0];
      break;

    case "topScopeStart": case "topScopeEnd":
      // ignore kbSymbol, e.g., methods can be in variables, classes, etc.
      targetSymbol = Object.values(globalThis.symbols).find(topSymbol => {
        return topSymbol.range.contains(selection.active);
      });
      break;

    default:
      break;
  }

  if (!targetSymbol) return;

  if (kbWhere.endsWith("Start")) {  // so cursor goes to the start of the symbol
    if (!kbSelect)                  // don't select
      editor.selections = [new vscode.Selection(targetSymbol.range.start, targetSymbol.range.start)];
    else                            // do select
      editor.selections = [extendSelection(targetSymbol, kbWhere, document)];
  }
  else if (kbWhere.endsWith("End")) {  // so cursor goes to the end of the symbol
    if (!kbSelect)
      editor.selections = [new vscode.Selection(targetSymbol.range.end, targetSymbol.range.end)];
    else
      editor.selections = [extendSelection(targetSymbol, kbWhere, document)];
  }
  else return;

  if (kbWhere.endsWith('Start'))
    editor.revealRange(new vscode.Range(editor.selections[0].start, editor.selections[0].start), vscode.TextEditorRevealType.Default); // Default = 0, as little scrolling as necessary
  else  // reveal the End for "...End" options
    editor.revealRange(new vscode.Range(editor.selections[0].end, editor.selections[0].end), vscode.TextEditorRevealType.Default); // Default = 0, as little scrolling as necessary
};

/**
 * @param {vscode.DocumentSymbol} target
 * @param {string} kbWhere
 * @param {vscode.TextDocument} document
 * @returns {vscode.Selection}
 */
function extendSelection(target, kbWhere, document) {

  // let extended = target.range.with({start: new vscode.Position(target.range.start.line, 0)});

  // to include comments at end of last line
  const lastLineLength = document.lineAt(target.range.end).text.length;

  // const extendedRange = extended.with({end: new vscode.Position(extended.end.line, lastLineLength)});
  const extendedRange = target.range.with({
    start: new vscode.Position(target.range.start.line, 0),
    end: new vscode.Position(target.range.end.line, lastLineLength)
  });

  if (kbWhere.endsWith("Start"))
    return new vscode.Selection(extendedRange.end, extendedRange.start);
  else        // if (kbWhere.endsWith("End"))
    return new vscode.Selection(extendedRange.start, extendedRange.end);
}


/** 
 * @param {vscode.DocumentSymbol} parent
 * @param {string} kbWhere - nextStart, currentStart, etc.
 * @param {SymMap} symMap
 * @param {SymMapKey[]} kbSymbol
 * @param {vscode.Selection} selection
 * @param {vscode.DocumentSymbol[]} result
 * @param {vscode.TextDocument} document
 * @returns {FlatArray<any, Infinity>}
 */
function deepSymbolRecursion(parent, kbWhere, symMap, kbSymbol, selection, result, document) {

  for (const child of parent.children) {
    if (child.children.length) {

      const union = new vscode.Range(new vscode.Position(child.range.start.line, 0), child.range.end);
      const extendedTargetRange = extendSelection(child, kbWhere, document);

      if (kbWhere.startsWith("previous")) {
        if (kbSymbol.some(symbol => symMap[symbol] === child.kind) && extendedTargetRange.end.isBefore(selection.active)) {
          deepSymbolRecursion(child, kbWhere, symMap, kbSymbol, selection, result, document);
        }
      }
      else if (kbWhere.startsWith("next")) {
        if (kbSymbol.some(symbol => symMap[symbol] === child.kind) && extendedTargetRange.start.isAfter(selection.active)) {
          deepSymbolRecursion(child, kbWhere, symMap, kbSymbol, selection, result, document);
        }
      }
      else if (kbWhere.startsWith("parent")) {  // combine with "current"
        // because, e.g., in const myVar2 = {}, the symbol start is at myVar2.  Only variables might be a problem
        // classes and functions are not
        // also needed when selecting to beginning of the line and symbol starts later in the line
        if (extendedTargetRange.contains(selection.active)) {
          deepSymbolRecursion(child, kbWhere, symMap, kbSymbol, selection, result, document);
        }
      }
      else if (kbWhere.startsWith("current")) {
        if (extendedTargetRange.contains(selection.active)) {
          deepSymbolRecursion(child, kbWhere, symMap, kbSymbol, selection, result, document);
        }
      }
    }
    if (kbWhere.startsWith("previous")) {
      const extendedTargetRange = extendSelection(child, kbWhere, document);

      if (kbSymbol.some(symbol => symMap[symbol] === child.kind) && extendedTargetRange.end.isBefore(selection.active)) {
        result.push(child);
      }
    }
    else if (kbWhere.startsWith("next")) {
      const extendedTargetRange = extendSelection(child, kbWhere, document);

      if (kbSymbol.some(symbol => symMap[symbol] === child.kind) && extendedTargetRange.start.isAfter(selection.active)) {
        result.push(child);
      }
    }
    else if (kbWhere.startsWith("parent")) {  // this could be combined with "current"
      const extendedTargetRange = extendSelection(child, kbWhere, document);

      if (extendedTargetRange.contains(selection.active)) {
        result.push(child);  // this isn't actually used, since use result[1]
        result.push(parent);
      }
    }
    else if (kbWhere.startsWith("current")) {   // currentStart/currentEnd
      const extendedTargetRange = extendSelection(child, kbWhere, document);

      if (extendedTargetRange.contains(selection.active)) {
        result.push(child);
      }
    }
  }
  return result.flat(Infinity);
}