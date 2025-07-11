const { DocumentSymbol } = require('vscode');


/**   
 * For .sort(compareRanges): put them into their proper positional order
 * Used in nextStart/End  and childStart/End to go to next FIRST matching symbol
 * @param { DocumentSymbol } symbol1
 * @param { DocumentSymbol } symbol2
 * 
 * @returns { 0 | 1 | -1 } 1 = isAfter, -1 = isBefore
 */
exports.compareRanges = function (symbol1, symbol2) {
  if ((symbol1.range.start.isBefore(symbol2.range.start))) return -1;
  else if ((symbol1.range.start.isAfter(symbol2.range.start))) return 1;
  else return 0;
};


/**   
 * For .sort(compareRangesReverse): put them into their proper reversed positional order
 * Used in previousStart/End to go to previous LAST matching symbol
 * @param { DocumentSymbol } symbol1
 * @param { DocumentSymbol } symbol2
 * 
 *  @returns { 0 | 1 | -1 } -1 = isAfter, 1 = isBefore
 */
exports.compareRangesReverse = function (symbol1, symbol2) {
  if ((symbol1.range.start.isBefore(symbol2.range.start))) return 1;
  else if ((symbol1.range.start.isAfter(symbol2.range.start))) return -1;
  else return 0;
};