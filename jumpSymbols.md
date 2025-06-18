# Symbol Traversal

You can create keybindings that will allow you to move and select functions, classes or methods relative to the current selection (cursor position).

* v0.8.0 Objects in a `.json` file that is a **JSON with Comments** file are considered to be "functions" (that seems strange to me but so be it) so you can traverse these objects using the `function` option.  

* Important: This extension uses the `DocumentSymbols` as provided by VS Code and the language providers you may be using.  For example, in javascript this **is** a `Function` symbol:

```javascript
function someFunc () {}
```

But the following are **not** `Function` symbols:

```javascript
const someFunc = function () {}

const square = x => x * x;
```

Instead, these are merely `Variable` kind of `DocumentSymbol`'s and are thus not useful for function traversal.  In order to make those work however, this extension uses the typescript compiler API to find such "nodes" and get their locations.  These are used in addition to any other symbols returned by `vscode.executeDocumentSymbolProvider`.  

So, for example, arrow function traversal should work (in javascript/typescript files) as well as variable declarations that point to a function.  

-----------------

* Example of traversal nextStart/previousStart with selection:  

<img src="https://github.com/ArturoDent/jump-and-select/blob/main/images/traverse!.gif?raw=true" width="700" height="800" alt="Example of moving up and down with selection"/>

-----------------

* Example of toggling between the start and end of a symbol (with no selection):  

<img src="https://github.com/ArturoDent/jump-and-select/blob/main/images/traverseStartEnd.gif?raw=true" width="700" height="350" alt="Example of toggling between start and end of a symbol"/>

-----------------

* Example of moving up the parents of a  symbol - note that with no selection the cursor jumps to the start or end of the symbol.:

<img src="https://github.com/ArturoDent/jump-and-select/blob/main/images/traverseParents.gif?raw=true" width="700" height="300" alt="Example of moving up the parents of a symbol"/>

-----------------

## Sample Keybindings

```jsonc
{
  "key": "shift+alt+c",                     // whatever keybinding you want
  "command": "jump-and-select.bySymbol",    // use this command
  "args": {
    "symbol": "function",                   // or "class" or "method"
    "where": "currentEnd",
    "select": true                          // default is false
  }
},

{
  "key": "alt+c",
  "command": "jump-and-select.bySymbol",
  "args": {
    "symbol": ["function", "class", "method"] ,
    "where": "currentStart"               // "select" defaults to false
  }
}
```

```jsonc
// to cycle between methods in a class or other container
{
  "key": "alt+down",          // whatever keybindings you want 
  "command": "jump-and-select.bySymbol",
  "args": {
    "symbol": "method",
    "where": "nextStart",
    "select": true
  }
},
{
  "key": "alt+up",
  "command": "jump-and-select.bySymbol",
  "args": {
    "symbol": "method",
    "where": "previousStart",
    "select": true
  }
}
```

These later 2 keybindings work in files like these, for example:

```javascript
// javascript/typescript
const car = {
  make: 'Honda',
  // cycle between these methods
  method1: function () {
    console.log(this.year + ' ' + this.make + ' ' + this.model);
  },
  method2: function () {
    console.log(this.year + ' ' + this.make + ' ' + this.model);
  },
};

class ClassWithMethods {
  // cycle between these methods
  method1() {
    return "hello world";
  }
  method2() {
    return "goodbye world";
  }
}
```

```python
# python
class Car():
  n_wheels = 4

  def method1(self, stuff):  # method
    self.open_trunk
    self.trunk.append(stuff)
    self.close_trunk

  def method2(self, stuff):  # method
    self.open_trunk
    self.trunk.append(stuff)
    self.close_trunk
```

```jsonc
// to walk up the parent symbols
{
  "key": "alt+up",              // whatever keybindings you want 
  "command": "jump-and-select.bySymbol",
  "args": {
    "where": "parentStart",     // or parentEnd
    // "select": true           // optional, default === false
  }
}
```

```jsonc
// to toggle between the start and end of a symbol - no selection (gif above)
{
  "key": "alt+up",
  "command": "jump-and-select.bySymbol",
  "args": {
    "symbol": [
      "class",
      "method",
      "function"
    ],
    "where": "currentStart",
  }
},
{
  "key": "alt+down",
  "command": "jump-and-select.bySymbol",
  "args": {
    "symbol": [
      "class",
      "method",
      "function"
    ],
    "where": "currentEnd",
  }
}
```

You should get intellisense for `jump-and-select.bySymbol` and the `symbol` and `select` options.  

## `symbol` Options: string or array, optional, default = ["function", "class", "method"]

* function
* class
* method

**Note**: if using `where` === topScope/topScopeEnd or parentStart/parentEnd or currentStart/currentEnd the `symbol` option is ignored.  You will always go to the parent or topScope no matter what kind of symbol that scope might happen to be.  For example, with this code:

```javascript
*const myVariable = {      // topScopeStart
  alpha: 12,
  method1: function () {
    *const myVar2 = {      // parentStart
    
      *omega: 15*          // if cursor here, currentStart and currentEnd
      
    };*                    // parentEnd
  }
};*                        // topScopeEnd, with select === true the cursor goes **after** the semicolon
```

If your cursor was anywhere in `myVariable` and you wished to go to the parent scope or topMost scope (`myVariable`) you will go there even though that symbol might be of `kind: variable`.  

* If `"select": true` and using one of the "...End`" where options, the trailing semicolon, if any, will be selected too.  In addition, any other text, like a comment, on that last line of a symbol will be selected.  

## `where` Options: string, optional, default = nextStart

These are all relative to the current cursor position.  Multiple cursors are not supported, other cursor positions will be lost.  

* previousStart - the previous symbol somewhere before the parentSymbol, at the same level as parent

* previousEnd

* currentStart - the current symbol's start or beginning, no matter how nested.  

* currentEnd

* nextStart - the next symbol somewhere after the parentSymbol, at the same level as parent

* nextEnd

* parentStart - the immediate parent symbol containing the cursor

* parentEnd  

* childStart - the first child symbol of the current symbol

* childEnd  

* topScopeStart - the outermost symbol (i.e., its top scope) containing the cursor, may contain nested symbols

* topScopeEnd

## `select` Option: boolean, optional, default = false

The entire symbol (function, class or method) will be selected if `select` is set to `true`.  

The cursor will be positioned at the beginning of those symbols where one of the `....Start` options was used (like `nextStart`).  
The cursor will be positioned at the end of those symbols where one of the `....End` options was used (like `nextEnd`).  
