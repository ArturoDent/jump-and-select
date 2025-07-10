// const vscode = require('vscode');

// import {vscode} from 'vscode';


// /** 
//  * @typedef  {Object} SymMap
//  * @property {vscode.SymbolKind.File} file?
//  * @property {vscode.SymbolKind.Module} module?
//  * @property {vscode.SymbolKind.Namespace} namespace?
//  * @property {vscode.SymbolKind.Package} package?
//  * @property {vscode.SymbolKind.Class} class?
//  * @property {vscode.SymbolKind.Mthod} method?
//  * @property {vscode.SymbolKind.Property} property?
//  * @property {vscode.SymbolKind.Field} field?
//  * @property {vscode.SymbolKind.Constructor} constructor?
//  * @property {vscode.SymbolKind.Enum} enum?
//  * @property {vscode.SymbolKind.Interface} interface?
//  * @property {vscode.SymbolKind.Function} function?
//  * @property {vscode.SymbolKind.Variable} variable?
//  * @property {vscode.SymbolKind.Constant} constant?
//  * @property {vscode.SymbolKind.String} string?
//  * @property {vscode.SymbolKind.Number} number?
//  * @property {vscode.SymbolKind.Boolean} boolean?
//  * @property {vscode.SymbolKind.Array} array?
//  * @property {vscode.SymbolKind.Object} object?
//  * @property {vscode.SymbolKind.Key} key?
//  * @property {vscode.SymbolKind.Null} null?
//  * @property {vscode.SymbolKind.EnumMember} enumMember?
//  * @property {vscode.SymbolKind.Struct} struct?
//  * @property {vscode.SymbolKind.Event} event?
//  * @property {vscode.SymbolKind.Operator} operator?
//  * @property {vscode.SymbolKind.TypeOperator} typeOperator?
// */

// /** @type {SymMapKey as keyof typeof SymMap} SymMapKey */

// /** @type {"file"|"module"|"namespace"|"package"|class"|"method"|"property"|"field"|"constructor"|"enum"|"interface"|"function"|"variable"|"constant"|"string"|"number"|"boolean"|"array"|"object"|"key"|"null"|"enumMember"|"struct"|"event"|"operator"|"typeOperator"} SymMapKey  */

// /** @type {any} SymMapKey */


// /** @type {SymMap} */
// export type SymMap = SymMap;

// /** @type {SymMapKey} */
// export type SymMapKey = SymMapKey;

// /**
//  * @exports
//  * @typedef {SymMap} SymMap
//  */
// export type SymMap = SymMap;

// /**
//  * @exports
//  * @typedef {SymMapKey} SymMapKey
//  */
// export type SymMapKey = SymMapKey;

export type SymMap = {
  file?: vscode.SymbolKind.File,
  module?: vscode.SymbolKind.Module,
  namespace?: vscode.SymbolKind.namespace,
  package?: vscode.SymbolKind.Package,
  class?: vscode.SymbolKind.Class,
  method?: vscode.SymbolKind.Method,
  property?: vscode.SymbolKind.Property,
  field?: vscode.SymbolKind.Field,
  constructor?: vscode.SymbolKind.Constructor,
  enum?: vscode.SymbolKind.Enum,
  interface?: vscode.SymbolKind.Interface,
  function?: vscode.SymbolKind.FUnction,
  variable?: vscode.SymbolKind.Variable,
  constant?: vscode.SymbolKind.Constant,
  string?: vscode.SymbolKind.String,
  number?: vscode.SymbolKind.Number,
  boolean?: vscode.SymbolKind.Boolean,
  array?: vscode.SymbolKind.Array,
  object?: vscode.SymbolKind.Object,
  key?: vscode.SymbolKind.Key,
  null?: vscode.SymbolKind.Null,
  enumMember?: vscode.SymbolKind.EnumMember,
  struct?: vscode.SymbolKind.Struct,
  event?: vscode.SymbolKind.Event,
  operator?: vscode.SymbolKind.Operator,
  typeParameter?: vscode.SymbolKind.TypeParameter,

  [key: string]: number;

};

export type SymMapKey = "file" | "module" | "namespace" | "package" | "class" | "method" | "property" | "field" | "constructor" | "enum" | "interface" | "function" | "variable" | "constant" | "string" | "number" | "boolean" | "array" | "object" | "key" | "null" | "enumMember" | "struct" | "event" | "operator" | "typeParameter";




// export type SymMapKey = "file":string|
//   file?: string,
//   module?: string,
//   method?: string,

//   [key: string]: string | number;
// };

// vscode.Symbol.Kind's

// File: 0;
// Module: 1;
// Namespace: 2;
// Package: 3;
// Class: 4;
// Method: 5;
// Property: 6;
// Field: 7;
// Constructor: 8;
// Enum: 9;
// Interface: 10;
// Function: 11;
// Variable: 12;
// Constant: 13;
// String: 14;
// Number: 15;
// Boolean: 16;
// Array: 17;
// Object: 18;
// Key: 19;
// Null: 20;
// EnumMember: 21;
// Struct: 22;
// Event: 23;
// Operator: 24;
// TypeParameter: 25;
