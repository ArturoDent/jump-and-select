const {DocumentSymbol} = require('vscode');
const {compareRanges} = require('./sort');

/** @import { SymMap, SymMapKey } from "./types.js" */


/**
 * Recursively visit all nested DocumentSymbols, from last child to first.
 * @param {DocumentSymbol[]} symbols - An array of DocumentSymbol objects.
 * @param {(symbol: DocumentSymbol) => void} callback - Function to execute on each symbol.
 */
exports.visitAllSymbols = function (symbols, callback) {
  for (const symbol of symbols) {
    if (symbol.children.length) {
      exports.visitAllSymbols(symbol.children.sort(compareRanges).toReversed(), callback);
    }
    callback(symbol);
  }
};


/**
 * 
 * @param {DocumentSymbol} symbol 
 * @param {SymMap} symMap
 * @returns {boolean}
 */
exports.isRightKind = function (symbol, symMap) {

  let isArrowFunction = false;

  if (arrowFunctionRanges) {
    isArrowFunction = globalThis.usesArrowFunctions ?
      !!arrowFunctionRanges.find(arrowRange => {
        return arrowRange.isEqual(symbol.range);
      }) : false;
  }
  return isArrowFunction || Object.values(symMap).includes(symbol.kind);
};


// if (Object.values(symMap).includes(symbol.kind)) result.push(symbol);
// else if (arrowFunctionRanges) {
//   let isArrowFunction = globalThis.usesArrowFunctions ?
//     !!arrowFunctionRanges.find(arrowRange => {
//       return arrowRange.isEqual(symbol.range);
//     }) : false;
//   if (isArrowFunction) result.push(symbol);
// }