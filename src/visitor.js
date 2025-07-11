const { DocumentSymbol } = require('vscode');
const { compareRangesReverse } = require('./sort');

/** @import { SymMap } from "./types.js" */


// this could be generalized as to direction - pass reverse or not
/**
 * Recursively visit all nested DocumentSymbols, from LAST child to FIRST.
 * @param { DocumentSymbol[] } symbols
 * @param { (symbol: DocumentSymbol) => void } callback - Function to execute on each symbol.
 */
exports.visitAllSymbols = function (symbols, callback) {
  for (const symbol of symbols) {
    if (symbol.children.length) {
      exports.visitAllSymbols(symbol.children.sort(compareRangesReverse), callback);
    }
    callback(symbol);
  }
};


/**
 * Is the 'symbol' either in the symbols option or an arrowFunction (and wants functions)
 * @param { DocumentSymbol } symbol 
 * @param { SymMap } symMap
 * 
 * @returns { boolean }
 */
exports.isRightKind = function (symbol, symMap) {

  if (Object.values(symMap).includes(symbol.kind)) return true;

  else if (arrowFunctionRanges) {
    let isArrowFunction = globalThis.usesArrowFunctions ?
      !!arrowFunctionRanges.find(arrowRange => {
        return arrowRange.isEqual(symbol.range);
      }) : false;
    if (isArrowFunction) return true;
  }

  return false;
};