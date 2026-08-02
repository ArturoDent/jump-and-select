const { DocumentSymbol } = require( 'vscode' );
const { compareRanges, compareRangesReverse } = require( './sort' );

/** @import { SymMap, SymMapKey } from "./types.js" */


// this could be generalized as to direction - pass reverse or not
/**
 * Recursively visit all nested DocumentSymbols, from LAST child to FIRST.
 * @param { DocumentSymbol[] } symbols
 * @param {any} compare
 * @param { (symbol: DocumentSymbol) => void } callback - Function to execute on each symbol.
 */
exports.visitAllSymbols = async function visitAllSymbols( symbols, compare, callback ) {

  for ( const symbol of symbols ) {

    if ( compare === compareRanges ) callback( symbol );   // put this first to get parent before 

    if ( symbol.children.length ) {
      await exports.visitAllSymbols( symbol.children.sort( compare ), compare, callback );
    }

    if ( compare === compareRangesReverse ) callback( symbol );
  }
};


/**
 * Is the 'symbol' either in the symbols option or an arrowFunction (and wants functions)
 * @param { DocumentSymbol } symbol 
 * @param { SymMap } symMap
 * 
 * @returns { boolean }
 */
exports.isRightKind = function ( symbol, symMap ) {

  if ( Object.values( symMap ).includes( symbol.kind ) ) return true;

  // if symMap.contains("function")? arrowFunctionSymbols will be empty anyway
  // else if ( arrowFunctionSymbols.length ) {
  else if ( arrowFunctionRanges.length ) {
    let isArrowFunction = globalThis.usesArrowFunctions ?
      // !!arrowFunctionSymbols.find( ( arrowFunction: any ) => {
      !!arrowFunctionRanges.find( arrowFunctionRange => {
        // return arrowFunction.range.isEqual( symbol.range );
        // return arrowFunction.range.isEqual( symbol.range );
        return arrowFunctionRange.isEqual( symbol.range );
      } ) : false;
    if ( isArrowFunction ) return true;
  }

  return false;
};