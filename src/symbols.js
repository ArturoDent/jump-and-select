const vscode = require('vscode');
const ts = require('typescript');
const { compareRanges, compareRangesReverse } = require('./sort');
const { visitAllSymbols, isRightKind } = require('./visitor');
const { symbolKindMap } = require('./symbolKindMap.js');

/** @import { SymMap, SymMapKey } from "./types.js" */


/**
 * 
 * @param { SymMapKey[] | undefined } kbSymbols
 * 
 * @returns { SymMap }
 */
function buildSymMap(kbSymbols) {

  /** @type { SymMap } */
  const symMap = {};

  if (kbSymbols) {
    kbSymbols?.forEach(kbSymbol => {
      if (symbolKindMap[kbSymbol]) symMap[kbSymbol] = symbolKindMap[kbSymbol];
    });
  }
  else {  // else no symbols in the keybinding or empty array for 'symbol'
    for (const [key, value] of Object.entries(symbolKindMap)) {
      symMap[key] = value;
    }
  }
  return symMap;
}


/** 
 * @param { SymMapKey[] } kbSymbols
 * @param { string } kbWhere
 * @param { boolean } kbSelect
 */
exports.jump2Symbols = async function (kbSymbols, kbWhere, kbSelect = false) {

  const symMap = buildSymMap(kbSymbols);
  if (!symMap || !kbWhere) return;  // notification?

  const editor = vscode.window.activeTextEditor;
  const document = editor?.document;
  let selection = vscode.window.activeTextEditor?.selection;
  if (!document || !selection) return;

  // current document was  or  current document is not the one for which the symbols were retrieved
  if (globalThis.refreshSymbols || globalThis.currentUri !== document.uri) {
    globalThis.symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);

    // TODO:  filter symbols ??

    globalThis.refreshSymbols = false;
    globalThis.currentUri = document.uri;
    if (!!document?.languageId.match(/javascript|typescript/)) globalThis.usesArrowFunctions = true;

    if (symMap.function && globalThis.usesArrowFunctions) {
      globalThis.arrowFunctionRanges = await getArrowFunctionRanges(document) || [];
    }
  }

  if (!globalThis.symbols?.length) return;

  /** @type { vscode.DocumentSymbol | undefined } */
  let parentSymbol, targetSymbol;
  let foundIndex = -1;

  /** @type { vscode.DocumentSymbol[] } */
  let result = [];

  switch (kbWhere) {

    case "previousStart": case "previousEnd":

      const numSymbols = Object.values(globalThis.symbols).length;

      parentSymbol = Object.values(globalThis.symbols).findLast((topSymbol, index) => {
        const parentExtendedRange = extendSelection(topSymbol, kbWhere, document);
        if (parentExtendedRange.contains(selection.active)) {
          foundIndex = index;
          return true;
        }
        else if (topSymbol.range.end.isAfter(selection.active)) foundIndex = index;
      });

      if (foundIndex === -1) foundIndex = numSymbols;

      if (parentSymbol?.children.length &&
        selection.active.line !== parentSymbol.range.start.line   // cursor on end line, if previousEnd
      ) {
        visitAllSymbols(parentSymbol.children.sort(compareRangesReverse), symbol => {

          if (result.length) return;  // does short-circuit rest of this function
          // but this line is still visited for each symbol

          if (symbol.range.start.isBefore(selection.start)) {
            if (isRightKind(symbol, symMap)) result.push(symbol);
          }
        });
        if (result.length) {
          targetSymbol = result[0];
          break;
        }
      }

      // !parentSymbol  = cursor was on a non-symbol (including empty space) or
      // in first symbol or before first symbol of a parent or 
      // parentSymbol has no children
      // if (!parentSymbol || (parentSymbol && !targetSymbol)) {
      if (parentSymbol && !targetSymbol && parentSymbol.range.start.isBefore(selection.start)
        &&
        selection.active.line !== parentSymbol.range.start.line) { // cursor on start line, if previousEnd

        if (isRightKind(parentSymbol, symMap)) {
          targetSymbol = parentSymbol;
          break;   // success
        }
      }

      // reverse and get only those preceding the selection
      const reversedGlobalSymbols = globalThis.symbols.slice(0, foundIndex).toReversed();

      for await (let previousSymbol of reversedGlobalSymbols) {

        if (!previousSymbol.children.length) {

          if (isRightKind(previousSymbol, symMap)) {
            targetSymbol = previousSymbol;
            break;   // success
          }
        }

        else if (previousSymbol.children.length) {

          visitAllSymbols(previousSymbol.children.sort(compareRangesReverse), symbol => {

            if (result.length) return;  // does short-circuit rest of this function

            if (symbol.range.start.isBefore(selection.start)) {
              if (isRightKind(symbol, symMap)) result.push(symbol);
            }
          });
          if (result.length) {
            targetSymbol = result[0];
            break;   // success
          }
        }
      }

      break;

    case "childStart": case "childEnd":

      parentSymbol = Object.values(globalThis.symbols).find(topSymbol => {
        // handles when you select before or beyond the range of a symbol, but same start/end lines
        const parentExtendedRange = extendSelection(topSymbol, kbWhere, document);
        if (parentExtendedRange.contains(selection.active)) return true;
        else return false;
      });

      if (!parentSymbol) return;
      // get the deepest symbol with the cursor, all kinds returned
      if (parentSymbol.children.length) result = deepSymbolRecursion(parentSymbol, kbWhere, symMap, kbSymbols, selection, result, document);

      let currentSymbol;

      if (!result.length && parentSymbol?.children.length) currentSymbol = parentSymbol;
      else if (result.length && result[0].children.length) currentSymbol = result[0];

      if (!currentSymbol) return;  // may be in a symbol but it has no children

      const sortedChildren = currentSymbol.children.sort(compareRanges);

      // go through children to see the first with matching kind, must consider arrow functions
      targetSymbol = sortedChildren.find(child => {

        if (child.range.start.isAfter(selection.start)) {

          return isRightKind(child, symMap);
        }
      });
      break;

    case "currentStart": case "currentEnd": case "parentStart": case "parentEnd":

      parentSymbol = Object.values(globalThis.symbols).find(topSymbol => {
        // handles when you select before or beyond the range of a symbol, but same start/end lines
        const parentExtendedRange = extendSelection(topSymbol, kbWhere, document);
        if (parentExtendedRange.contains(selection.active)) return true;
        else return false;
      });

      if (!parentSymbol) return;
      if (parentSymbol.children.length) result = deepSymbolRecursion(parentSymbol, kbWhere, symMap, kbSymbols, selection, result, document);

      if (!result.length) {   // consider parentSymbol only

        if (isRightKind(parentSymbol, symMap)) {
          targetSymbol = parentSymbol;
          break;   // success
        }
      }

      else if (result.length && kbWhere.startsWith("current")) {   // could be combined with parent if !result.push(child) below
        targetSymbol = result[0];
      }
      else if (result.length > 1 && kbWhere.startsWith("parent"))  // == deepestParent of the deepestChild
        targetSymbol = result[1];
      break;

    case "nextStart": case "nextEnd":

      parentSymbol = Object.values(globalThis.symbols).find((topSymbol, index) => {
        const parentExtendedRange = extendSelection(topSymbol, kbWhere, document);
        if (parentExtendedRange.contains(selection.active)) {
          foundIndex = index;
          return true;
        }
        else if (topSymbol.range.end.isBefore(selection.active)) foundIndex = index;
      });

      if (parentSymbol?.children.length) {
        result = deepSymbolRecursion(parentSymbol, kbWhere, symMap, kbSymbols, selection, result, document);
        if (result.length) {
          targetSymbol = result[0];
          break;
        }
      }

      // parentSymbol may be undefined now or has no children or no more matching children
      for await (const nextSymbol of Object.values(globalThis.symbols).slice(foundIndex + 1)) {

        // let isArrowFunction = false;

        // !parentSymbol  = cursor was on a non-symbol (including empty space) or
        // in last symbol or after last symbol of a parent or 
        // parentSymbol has no children
        if (!parentSymbol || (parentSymbol && !targetSymbol)) {

          if (isRightKind(nextSymbol, symMap)) {
            targetSymbol = nextSymbol;
            break;   // success
          }
        }

        if (nextSymbol.children.length) {
          result = nextRecursion(nextSymbol, kbWhere, symMap, kbSymbols, selection, result, document);
          if (result.length) {
            targetSymbol = result[0];
            break;   // success
          }
        }
      }

      break;

    case "topStart": case "topEnd":
      // ignore kbSymbol, e.g., methods can be in variables, classes, etc.
      targetSymbol = Object.values(globalThis.symbols).find(topSymbol => {
        const topSymbolExtendedRange = extendSelection(topSymbol, kbWhere, document);
        return topSymbolExtendedRange.contains(selection.active);
      });
      break;

    // case "topNextStart": case "topEnd":
    //   // ignore kbSymbol, e.g., methods can be in variables, classes, etc.
    //   targetSymbol = Object.values(globalThis.symbols).find(topSymbol => {
    //     const topSymbolExtendedRange = extendSelection(topSymbol, kbWhere, document);
    //     return topSymbolExtendedRange.contains(selection.active);
    //   });
    //   break;

    default:
      break;
  };

  if (!targetSymbol) return;

  if (kbWhere.endsWith("Start")) {  // so cursor goes to the start of the symbol
    if (!kbSelect)                  // don't select
      editor.selections = [new vscode.Selection(targetSymbol.range.start, targetSymbol.range.start)];
    else                            // do select
      editor.selections = [symbolSelection(targetSymbol, kbWhere, document)];
  }
  else if (kbWhere.endsWith("End")) {  // so cursor goes to the end of the symbol
    if (!kbSelect)
      editor.selections = [new vscode.Selection(targetSymbol.range.end, targetSymbol.range.end)];
    else
      editor.selections = [symbolSelection(targetSymbol, kbWhere, document)];
  }
  else return;

  if (kbWhere.endsWith('Start'))
    editor.revealRange(new vscode.Range(editor.selections[0].start, editor.selections[0].start), vscode.TextEditorRevealType.Default); // Default = 0, as little scrolling as necessary
  else      // reveal the End for "...End" options
    editor.revealRange(new vscode.Range(editor.selections[0].end, editor.selections[0].end), vscode.TextEditorRevealType.Default); // Default = 0, as little scrolling as necessary
};


/**
 * 
 * @param { vscode.TextDocument } document
 * 
 * @returns { Promise<vscode.Range[] | undefined >}
 */
async function getArrowFunctionRanges(document) {

  /** @type { vscode.Range[] } */
  const arrowFunctionRanges = [];

  const program = ts.createProgram([document.fileName], { allowJs: true });
  const sourceFile = program.getSourceFile(document.fileName);
  // const checker = program.getTypeChecker();
  if (!sourceFile) return;


  function visit(/** @type { ts.Node } */ node) {

    // e.g., const someFunc = function () {};
    // ts.isVariableStatement(node);  // true for the above
    // node.declarationList.declarations[0].initializer.kind === 201 a FunctionExpression

    if (ts.isVariableStatement(node) && node.declarationList.declarations[0].initializer) {
      if (ts.isFunctionExpression(node.declarationList.declarations[0].initializer)) {

        const triviaWidth = node.declarationList.declarations[0].initializer.getLeadingTriviaWidth(sourceFile);

        const startPos = document.positionAt(node.declarationList.declarations.pos).translate({ characterDelta: triviaWidth });
        // use this to match the symbol locations provided by vscode documentSymbol
        const fullRange = new vscode.Range(startPos, document.positionAt(node.declarationList.declarations.end));

        arrowFunctionRanges.push(fullRange);
      }
    }

    // e.g., const square1 = x => x * x;  initializer is x => x * x
    // any space/jsdoc, etc. before the name (square1) is trivia
    else if (ts.isVariableDeclaration(node) && !!node.initializer && ts.isArrowFunction(node.initializer)) {
      if (document) {



        // getLeadingTriviaWidth() needs to have the sourceFile parameter to work
        // see https://stackoverflow.com/a/67810822/836330 and 
        // https://github.com/microsoft/TypeScript/issues/14808#issuecomment-289020765

        const triviaWidth = node.name.end - node.name.pos - node.name.getText(sourceFile).length;

        // const triviaWidth = node.initializer.getLeadingTriviaWidth(sourceFile);
        // above DOES NOT handle "const /** @type { any } */ square2 = x => x * x;" correctly

        const startPos = document.positionAt(node.pos).translate({ characterDelta: triviaWidth });
        const fullRange = new vscode.Range(startPos, document.positionAt(node.end));

        arrowFunctionRanges.push(fullRange);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return arrowFunctionRanges;
}

/**
 * Extend the selection to the 0th column of the start line and
 * to the end of any text on the end line, so include a trailing comment.
 * Used for comparing the cursor position to the "extended" document selection.
 * @param { vscode.DocumentSymbol | { range: vscode.Range, kind: vscode.SymbolKind } } target
 * @param { string } kbWhere
 * @param { vscode.TextDocument } document
 * 
 * @returns { vscode.Selection }
 */
function extendSelection(target, kbWhere, document) {

  let extendedRange;
  const lastLineLength = document.lineAt(target.range.end).text.length;

  extendedRange = target.range.with({
    start: new vscode.Position(target.range.start.line, 0),
    end: new vscode.Position(target.range.end.line, lastLineLength)
  });

  if (kbWhere.endsWith("Start"))
    return new vscode.Selection(extendedRange.end, extendedRange.start);
  else        // if (kbWhere.endsWith("End"))
    return new vscode.Selection(extendedRange.start, extendedRange.end);
}


/**
 * Extend the selection from the start of non-whitespace on the symbol start line
 * to the end of any text on the end line, so include a trailing comment.
 * 
 * Used for making the actual selection if that option in the keybinding.
 * @param { vscode.DocumentSymbol } target
 * @param { string } kbWhere
 * @param { vscode.TextDocument } document
 * 
 * @returns { vscode.Selection }
 */
function symbolSelection(target, kbWhere, document) {

  const lastLineLength = document.lineAt(target.range.end).text.length;
  const firstLineStart = document.lineAt(target.range.start).firstNonWhitespaceCharacterIndex;

  const extendedRange = target.range.with({
    start: new vscode.Position(target.range.start.line, firstLineStart),
    end: new vscode.Position(target.range.end.line, lastLineLength)
  });

  if (kbWhere.endsWith("Start"))
    return new vscode.Selection(extendedRange.end, extendedRange.start);
  else        // if (kbWhere.endsWith("End"))
    return new vscode.Selection(extendedRange.start, extendedRange.end);
}


/** 
 * @param { vscode.DocumentSymbol } parent
 * @param { string } kbWhere - nextStart, currentStart, etc.
 * @param { SymMap } symMap
 * @param { SymMapKey[] } kbSymbol
 * @param { vscode.Selection } selection
 * @param { vscode.DocumentSymbol[] } result
 * @param { vscode.TextDocument } document
 * 
 * @returns { vscode.DocumentSymbol[] }
 */
function deepSymbolRecursion(parent, kbWhere, symMap, kbSymbol, selection, result, document) {

  /** @type { vscode.DocumentSymbol[] } */
  const sortedChildren = parent.children.sort(compareRanges);

  sortedChildren.forEach((child, index) => {

    if (child.children.length) {
      const extendedTargetRange = extendSelection(child, kbWhere, document);
      if (extendedTargetRange.contains(selection.active)) {
        deepSymbolRecursion(child, kbWhere, symMap, kbSymbol, selection, result, document);
      }
    }

    // rest are leaf nodes 

    if (kbWhere.startsWith("previous")) {

      const extendedChildRange = extendSelection(child, kbWhere, document);

      if (extendedChildRange.end.isBefore(selection.active)) {
        if (isRightKind(child, symMap)) result.push(child);
      }

      else {

        const extendedTargetRange = extendSelection(child, kbWhere, document);

        if (extendedTargetRange.contains(selection.active)) {
          // scan previous of sortedChildren after index to see if any are functions, etc.
          const previousMatchingSymbol = sortedChildren.slice(0, index).findLast(child => {

            if (isRightKind(child, symMap)) return true;
          });
          if (previousMatchingSymbol) result.push(previousMatchingSymbol);
        }
      }
    }
    else if (kbWhere.startsWith("next")) {

      const extendedChildRange = extendSelection(child, kbWhere, document);

      // isAfter isn't depth-first if select to end of symbol
      // for depth-first next's use contains
      if (extendedChildRange.start.isAfter(selection.active) || selection.contains(extendedChildRange)) {
        if (isRightKind(child, symMap)) result.push(child);
      }

      else {

        const extendedTargetRange = extendSelection(child, kbWhere, document);

        if (extendedTargetRange.contains(selection.active)) {
          // scan rest (next) of sortedChildren after index to see if any are functions, etc.
          const nextMatchingSymbol = sortedChildren.slice(index + 1).find((child, i) => {

            if (isRightKind(child, symMap)) return true;
          });
          if (nextMatchingSymbol) result.push(nextMatchingSymbol);
        }
      }
    }
    else if (kbWhere.startsWith("parent")) {
      if (!child.range.isEqual(child.selectionRange)) {
        const extendedTargetRange = extendSelection(child, kbWhere, document);

        if (extendedTargetRange.contains(selection.active)) {
          result.push(child);  // this isn't actually used, since only use result[1] above
          result.push(parent);
        }
      }
    }
    else if (kbWhere.startsWith("current")) {   // currentStart/currentEnd
      const extendedTargetRange = extendSelection(child, kbWhere, document);

      // will ignore variables unless arrow function
      if (extendedTargetRange.contains(selection.active)) {
        if (isRightKind(child, symMap)) result.push(child);
      }
    }
    else if (kbWhere.startsWith("child")) {   // currentStart/currentEnd
      const extendedTargetRange = extendSelection(child, kbWhere, document);

      if (extendedTargetRange.contains(selection.active)) result.push(child);
    }
  });
  return result;
}


/** 
 * @param { vscode.DocumentSymbol } parent
 * @param { string } kbWhere - nextStart, currentStart, etc.
 * @param { SymMap } symMap
 * @param { SymMapKey[] } kbSymbol
 * @param { vscode.Selection } selection
 * @param { vscode.DocumentSymbol[] } result
 * @param { vscode.TextDocument } document
 * 
 * @returns { vscode.DocumentSymbol[] }
 */
function nextRecursion(parent, kbWhere, symMap, kbSymbol, selection, result, document) {

  /** @type { vscode.DocumentSymbol[] } */
  const sortedChildren = parent.children.sort(compareRanges);

  sortedChildren.forEach(child => {

    if (child.children.length) {
      const extendedTargetRange = extendSelection(child, kbWhere, document);
      if (extendedTargetRange.start.isBefore(selection.active)) {

        nextRecursion(child, kbWhere, symMap, kbSymbol, selection, result, document);
      }
    }

    // rest are leaf nodes 

    else if (kbWhere.startsWith("next")) {

      // scan rest (next) of sortedChildren after index to see if any are functions, etc.
      const nextMatchingSymbol = sortedChildren.find(child => {

        if (isRightKind(child, symMap)) return true;
      });
      if (nextMatchingSymbol) result.push(nextMatchingSymbol);
    }
  });
  return result;
};