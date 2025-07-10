const vscode = require('vscode');

exports.symbolKindMap = {
  "file": vscode.SymbolKind.File,
  "module": vscode.SymbolKind.Module,
  "namespace": vscode.SymbolKind.Namespace,
  "package": vscode.SymbolKind.Package,
  "class": vscode.SymbolKind.Class,
  "method": vscode.SymbolKind.Method,
  "property": vscode.SymbolKind.Property,
  "field": vscode.SymbolKind.Field,
  "constructor": vscode.SymbolKind.Constructor,
  "enum": vscode.SymbolKind.Enum,
  "interface": vscode.SymbolKind.Interface,
  "function": vscode.SymbolKind.Function,
  "variable": vscode.SymbolKind.Variable,
  "constant": vscode.SymbolKind.Constant,
  "string": vscode.SymbolKind.String,
  "number": vscode.SymbolKind.Number,
  "boolean": vscode.SymbolKind.Boolean,
  "array": vscode.SymbolKind.Array,
  "object": vscode.SymbolKind.Object,
  "key": vscode.SymbolKind.Key,
  "null": vscode.SymbolKind.Null,
  "enumMember": vscode.SymbolKind.EnumMember,
  "struct": vscode.SymbolKind.Struct,
  "event": vscode.SymbolKind.Event,
  "operator": vscode.SymbolKind.Operator,
  "typeParameter": vscode.SymbolKind.TypeParameter,

  // [key: string]: number
};