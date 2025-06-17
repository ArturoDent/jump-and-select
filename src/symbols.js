const vscode = require('vscode');
const ts = require('typescript');


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

  // current document was  or  current document is not the one for which the symbols were retrieved
  if (globalThis.refreshSymbols || globalThis.currentUri !== document.uri) {
    globalThis.symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);

    // // filter symbols ??
    // if (kbSymbol.includes("function") && globalThis.usesArrowFunctions) {
    //   globalThis.arrowFunctionRanges = await getArrowFunctionRanges(document) || [];
    // };

    // const isArrowFunction = globalThis.usesArrowFunctions ?
    //   !!globalThis.arrowFunctionRanges.find(arrowRange => {
    //     return arrowRange.isEqual(globalSymbol.range);
    //   }) : false;

    // globalThis.symbols = globalThis.symbols?.filter(globalSymbol => {
    //   return isArrowFunction || kbSymbol.some(symbol => symMap[symbol] === globalSymbol.kind);
    // });

    globalThis.refreshSymbols = false;
    globalThis.currentUri = document.uri;
    if (!!document?.languageId.match(/javascript|typescript/)) globalThis.usesArrowFunctions = true;

    if (kbSymbol.includes("function") && globalThis.usesArrowFunctions) {
      globalThis.arrowFunctionRanges = await getArrowFunctionRanges(document) || [];
    }
  }

  if (!globalThis.symbols?.length) return;

  /** @type {vscode.DocumentSymbol | undefined} */
  let parentSymbol, targetSymbol;
  let foundIndex = -1;

  /** @type {vscode.DocumentSymbol[]} */
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

      if (parentSymbol?.children.length &&
        selection.active.line !== parentSymbol.range.end.line   // cursor on end line, previousEnd
      ) {
        result = deepSymbolRecursion(parentSymbol, kbWhere, symMap, kbSymbol, selection, result, document);
        if (result.length) {
          targetSymbol = result.at(-1);
          break;
        }
        // else go to parentSymbol if right kind, BUT not already there !!!
        else if (selection.active.line !== parentSymbol.selectionRange.start.line) {  // previousStart
          // is cursor on the parentSymbol definiton line?
          const isArrowFunction = globalThis.usesArrowFunctions ?
            !!globalThis.arrowFunctionRanges.find(arrowRange => {
              // @ts-ignore
              return arrowRange.isEqual(parentSymbol.range);
            }) : false;
          // @ts-ignore
          if (isArrowFunction || kbSymbol.some(symbol => symMap[symbol] === parentSymbol.kind)) {
            targetSymbol = parentSymbol;
            break;
          }
        }
      }

      // reverse and get only those preceding the selection
      if (foundIndex === -1) foundIndex = numSymbols;
      const reversedGlobalSymbols = globalThis.symbols.slice(0, foundIndex).toReversed();

      // parentSymbol may be undefined now or has no children or no more matching children
      for await (const previousSymbol of reversedGlobalSymbols) {

        const isArrowFunction = globalThis.usesArrowFunctions ?
          !!globalThis.arrowFunctionRanges.find(arrowRange => {
            return arrowRange.isEqual(previousSymbol.range);
          }) : false;

        if (previousSymbol.children.length) {
          result = nextPreviousRecursion(previousSymbol, kbWhere, symMap, kbSymbol, selection, result, document);
          if (result.length) {
            targetSymbol = result[0];
            break;   // success
          }
        }

        // !parentSymbol  = cursor was on a non-symbol (including empty space) or
        // in first symbol or before first symbol of a parent or 
        // parentSymbol has no children
        if (!parentSymbol || (parentSymbol && !targetSymbol)) {
          if (isArrowFunction || kbSymbol.some(symbol => symMap[symbol] === previousSymbol.kind)) {
            targetSymbol = previousSymbol;
            break;   // success
          }
        }

        // previousSymbol has no children, so only look at its kind
        else if (isArrowFunction || kbSymbol.some(symbol => symMap[symbol] === previousSymbol.kind)) {
          targetSymbol = previousSymbol;
          break;
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

      if (parentSymbol?.children.length) {
        // children must be sorted, they are returned in alphabetical order
        const sortedChildren = parentSymbol.children.sort(compareRanges);
        targetSymbol = sortedChildren[0];
      }

      break;

    case "currentStart": case "currentEnd": case "parentStart": case "parentEnd":

      parentSymbol = Object.values(globalThis.symbols).find(topSymbol => {
        // handles when you select before or beyond the range of a symbol, but same start/end lines
        const parentExtendedRange = extendSelection(topSymbol, kbWhere, document);
        if (parentExtendedRange.contains(selection.active)) return true;
        else return false;
      });

      if (!parentSymbol) return;
      if (parentSymbol.children.length) result = deepSymbolRecursion(parentSymbol, kbWhere, symMap, kbSymbol, selection, result, document);

      if (!result.length) targetSymbol = parentSymbol;

      // for parentStart/parentEnd
      // result[] = deepestChild, deepestParent, nextDeepestChild(= deepestParent), nextDeepestParent, etc.

      if (result.length && kbWhere.startsWith("current")) {   // could be combined with parent if !result.push(child) below
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
        result = deepSymbolRecursion(parentSymbol, kbWhere, symMap, kbSymbol, selection, result, document);
        if (result.length) {
          targetSymbol = result[0];
          break;
        }
      }

      // parentSymbol may be undefined now or has no children or no more matching children
      for await (const nextSymbol of Object.values(globalThis.symbols).slice(foundIndex + 1)) {

        const isArrowFunction = globalThis.usesArrowFunctions ?
          !!globalThis.arrowFunctionRanges.find(arrowRange => {
            return arrowRange.isEqual(nextSymbol.range);
          }) : false;

        // !parentSymbol  = cursor was on a non-symbol (including empty space) or
        // in last symbol or after last symbol of a parent or 
        // parentSymbol has no children
        if (!parentSymbol || (parentSymbol && !targetSymbol)) {
          if (isArrowFunction || kbSymbol.some(symbol => symMap[symbol] === nextSymbol.kind)) {
            targetSymbol = nextSymbol;
            break;   // success
          }
        }

        if (nextSymbol.children.length) {
          result = nextPreviousRecursion(nextSymbol, kbWhere, symMap, kbSymbol, selection, result, document);
          if (result.length) {
            targetSymbol = result[0];
            break;   // success
          }
        }

        // nextSymbol has no children, so only look at its kind
        else if (isArrowFunction || kbSymbol.some(symbol => symMap[symbol] === nextSymbol.kind)) {
          targetSymbol = nextSymbol;
          break;
        }
      }

      break;

    case "topScopeStart": case "topScopeEnd":
      // ignore kbSymbol, e.g., methods can be in variables, classes, etc.
      targetSymbol = Object.values(globalThis.symbols).find(topSymbol => {
        const topScopeSymbolExtendedRange = extendSelection(topSymbol, kbWhere, document);
        return topScopeSymbolExtendedRange.contains(selection.active);
      });
      break;

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
 * @param {vscode.TextDocument} document 
 * @returns {Promise<vscode.Range[]|undefined>}
 */
async function getArrowFunctionRanges(document) {

  /** @type {vscode.Range[]} */
  const arrowFunctionRanges = [];

  const program = ts.createProgram([document.fileName], {allowJs: true});
  const sourceFile = program.getSourceFile(document.fileName);
  // const checker = program.getTypeChecker();
  // checker.
  if (!sourceFile) return;


  function visit(/** @type {ts.Node} */ node) {

    // e.g., const someFunc = function () {};
    // ts.isVariableStatement(node);  // true for the above
    // node.declarationList.declarations[0].initializer.kind === 201 a FunctionExpression

    if (ts.isVariableStatement(node) && node.declarationList.declarations[0].initializer) {
      if (ts.isFunctionExpression(node.declarationList.declarations[0].initializer)) {

        const triviaWidth = node.declarationList.declarations[0].initializer.getLeadingTriviaWidth(sourceFile);

        const startPos = document.positionAt(node.declarationList.declarations.pos).translate({characterDelta: triviaWidth});
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
        // above DOES NOT handle "const /** @type {any} */ square2 = x => x * x;" correctly

        const startPos = document.positionAt(node.pos).translate({characterDelta: triviaWidth});
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
 * @param {vscode.DocumentSymbol|{range: vscode.Range, kind: vscode.SymbolKind}} target
 * @param {string} kbWhere
 * @param {vscode.TextDocument} document
 * @returns {vscode.Selection}
 */
function extendSelection(target, kbWhere, document) {

  let extendedRange;

  // to extend selection to 0th column of the start line

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
 * @param {vscode.DocumentSymbol} target
 * @param {string} kbWhere
 * @param {vscode.TextDocument} document
 * @returns {vscode.Selection}
 */
function symbolSelection(target, kbWhere, document) {

  // to include comments at end of last line

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
 * @param {vscode.DocumentSymbol} symbol1
 * @param {vscode.DocumentSymbol} symbol2
 */
function compareRanges(symbol1, symbol2) {
  if ((symbol1.range.start.isBefore(symbol2.range.start))) return -1;
  else if ((symbol1.range.start.isAfter(symbol2.range.start))) return 1;
  else return 0;
}


/** 
 * @param {vscode.DocumentSymbol} parent
 * @param {string} kbWhere - nextStart, currentStart, etc.
 * @param {SymMap} symMap
 * @param {SymMapKey[]} kbSymbol
 * @param {vscode.Selection} selection
 * @param {vscode.DocumentSymbol[]} result
 * @param {vscode.TextDocument} document
 * @returns {vscode.DocumentSymbol[]}
 */
function deepSymbolRecursion(parent, kbWhere, symMap, kbSymbol, selection, result, document) {

  /** @type {vscode.DocumentSymbol[] } */
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

      const reverseSorted = sortedChildren.toReversed();

      const extendedChildRange = extendSelection(child, kbWhere, document);

      if (extendedChildRange.end.isBefore(selection.active)) {

        const isArrowFunction = globalThis.usesArrowFunctions ?
          !!globalThis.arrowFunctionRanges.find(arrowRange => {
            return arrowRange.isEqual(child.range);
          }) : false;

        if (isArrowFunction || kbSymbol.some(symbol => symMap[symbol] === child.kind)) result.push(child);
      }

      else {

        const extendedTargetRange = extendSelection(child, kbWhere, document);

        if (extendedTargetRange.contains(selection.active)) {
          // scan previous of sortedChildren after index to see if any are functions, etc.
          const previousMatchingSymbol = sortedChildren.slice(0, index).findLast(({kind, range}) => {

            const isArrowFunction = globalThis.usesArrowFunctions ?
              !!globalThis.arrowFunctionRanges.find(arrowRange => arrowRange.isEqual(range)) : false;

            // what if don't want functions, actually handled elsewhere
            return isArrowFunction || kbSymbol.some(symbol => symMap[symbol] === kind);
          });
          if (previousMatchingSymbol) result.push(previousMatchingSymbol);
        }
      }
    }
    else if (kbWhere.startsWith("next")) {

      // if child is of the right kind, result.push(child)
      // else look for next

      const extendedChildRange = extendSelection(child, kbWhere, document);

      if (extendedChildRange.start.isAfter(selection.active)) {

        const isArrowFunction = globalThis.usesArrowFunctions ?
          !!globalThis.arrowFunctionRanges.find(arrowRange => {
            return arrowRange.isEqual(child.range);
          }) : false;

        if (isArrowFunction || kbSymbol.some(symbol => symMap[symbol] === child.kind)) result.push(child);
      }

      else {

        const extendedTargetRange = extendSelection(child, kbWhere, document);

        if (extendedTargetRange.contains(selection.active)) {
          // scan rest (next) of sortedChildren after index to see if any are functions, etc.
          const nextMatchingSymbol = sortedChildren.slice(index + 1).find(({kind, range}, i) => {

            const isArrowFunction = globalThis.usesArrowFunctions ?
              !!globalThis.arrowFunctionRanges.find(arrowRange => {
                return arrowRange.isEqual(range);
              }) : false;

            // TODO: what if don't want functions, handled elsewhere
            return isArrowFunction || kbSymbol.some(symbol => symMap[symbol] === kind);
          });
          if (nextMatchingSymbol) result.push(nextMatchingSymbol);
        }
      }
    }
    else if (kbWhere.startsWith("parent")) {
      // in python: def subMethod2(self, stuff): "stuff" is a returned symbol, so don't extend its range!
      // just ignore those
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

        const isArrowFunction = globalThis.usesArrowFunctions ?
          !!globalThis.arrowFunctionRanges.find(arrowRange => arrowRange.isEqual(child.range)) : false;

        // const isRightKind = isArrowFunction || kbSymbol.some(symbol => symMap[symbol] === child.kind);
        const isRightKind = isArrowFunction || (child.kind !== vscode.SymbolKind.Variable && child.kind !== vscode.SymbolKind.Property);

        if (isRightKind) result.push(child);
      }
    }
  });
  return result;
}


/** 
 * @param {vscode.DocumentSymbol} parent
 * @param {string} kbWhere - nextStart, currentStart, etc.
 * @param {SymMap} symMap
 * @param {SymMapKey[]} kbSymbol
 * @param {vscode.Selection} selection
 * @param {vscode.DocumentSymbol[]} result
 * @param {vscode.TextDocument} document
 * @returns {vscode.DocumentSymbol[]}
 */
function nextPreviousRecursion(parent, kbWhere, symMap, kbSymbol, selection, result, document) {

  /** @type {vscode.DocumentSymbol[] } */
  const sortedChildren = parent.children.sort(compareRanges);

  sortedChildren.forEach((child) => {

    if (child.children.length) {
      const extendedTargetRange = extendSelection(child, kbWhere, document);
      if (extendedTargetRange.contains(selection.active)) {
        nextPreviousRecursion(child, kbWhere, symMap, kbSymbol, selection, result, document);
      }
    }

    // rest are leaf nodes 

    if (kbWhere.startsWith("previous")) {
      // const extendedTargetRange = extendSelection(child, kbWhere, document);

      const previousMatchingSymbol = sortedChildren.findLast(({kind, range}) => {

        const isArrowFunction = globalThis.usesArrowFunctions ?
          !!globalThis.arrowFunctionRanges.find(arrowRange => arrowRange.isEqual(range)) : false;

        // what if don't want functions, actually handled elsewhere
        return isArrowFunction || kbSymbol.some(symbol => symMap[symbol] === kind);
      });
      if (previousMatchingSymbol) result.push(previousMatchingSymbol);
    }
    else if (kbWhere.startsWith("next")) {

      // scan rest (next) of sortedChildren after index to see if any are functions, etc.
      const nextMatchingSymbol = sortedChildren.find(({kind, range}, i) => {

        const isArrowFunction = globalThis.usesArrowFunctions ?
          !!globalThis.arrowFunctionRanges.find(arrowRange => {
            return arrowRange.isEqual(range);
          })
          : false;

        // TODO: what if don't want functions, handled elsewhere
        return isArrowFunction || kbSymbol.some(symbol => symMap[symbol] === kind);
      });
      if (nextMatchingSymbol) result.push(nextMatchingSymbol);
    }
  });
  return result;
}