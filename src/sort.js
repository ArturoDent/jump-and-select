const {DocumentSymbol} = require('vscode');



/**   
 * For .sort(compareRanges): put them into their proper positional order
 * @param {DocumentSymbol} symbol1
 * @param {DocumentSymbol} symbol2
 */
exports.compareRanges = function (symbol1, symbol2) {
  if ((symbol1.range.start.isBefore(symbol2.range.start))) return -1;
  else if ((symbol1.range.start.isAfter(symbol2.range.start))) return 1;
  else return 0;
};