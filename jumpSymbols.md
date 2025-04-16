# Symbol Traversal

You can create keybindings that will allow you to move and select various functions, classes or methods relative to the current selection (cursor position).

* Important: This extension uses the `DocumentSymbols` as provided by VS Code and the language providers you may be using.  For example, in javascript this **is** a `Function` symbol:

```javascript
function someFunc () {}
```

But the following is **not** a `Function` symbol:

```javascript
const someFunc = function () {}
```

Instead, that is merely a `Variable` kind of `DocumentSymbol` and is thus not useful for function traversal.  In other words, that kind of `Variable` symbol is ignored by this extension.  

## Sample Keybindings

```json
{
  "key": "shift+alt+j",                  // whatever keybinding you want
  "command": "jump-and-select.bySymbol",    // use this command
  "args": {
    "symbol": "function",                  // or "class" or "method"
    "where": "currentEnd",
    "select": true                       // default is false
  }
},

{
  "key": "alt+j",
  "command": "jump-and-select.bySymbol",
  "args": {
    "symbol": "class",
    "where": "nextEnd"                   // "select" defaults to false
  }
},

{
  "key": "alt+j",
  "command": "jump-and-select.bySymbol",
  "args": {
    "symbol": ["function", "class", "method"] ,
    "where": "currentStart"              // "select" defaults to false
  }
}
```

You should get intellisense for `jump-and-select.bySymbol` and the `go` and `select` options.  

## Where the cursor jumps to:

```javascript
// cursor jumps to the *'s for each option
// javascript

// "symbol": "function"

*function PreviousFunc () {         // previousStart, at same level as the parent function

}*                                  // previousEnd


*function Parent () {               // topScopeStart, outermost scope
  function Child1 () {
    // if cursor is here, this is the currentFunction
  }

  *function Child2 () {             // parentStart, parent of SubChild1
    *function SubChild1 () {        // currentStart

      cursor starts here            // assume CURSOR is here inside SubChild1

    }*                              // currentEnd
  }*                                // parentEnd, parent of SubChild1
}*                                  // topScopeStart

*function NextFunction () {         // nextStart, at same level as the parent function

}*                                  // nextEnd
```

```python
#  cursor jumps to the *'s for each option
#  python

#  "symbol": "function"

*def Parent(a, b):    # topScopeStart, outermost scope and parentStart, immediate parent function
  sum_result = a + b

  *def Child1(a, b):                 # currentStart
    sum_result = a + b
    # cursor starts here             # assume CURSOR is here inside SubChild1
    return sum_result*               # currentEnd
  return sum_result*                 # topScopeStart and parentEnd, immediate parent function


*def Next(a, b):                     # nextStart
  sum_result = a + b
  return sum_result*                 # nextEnd
```

```python
#  cursor jumps to the *'s for each option
#  python

#  "symbol": "class"

*class Employee:                     # topScopeStart and parentStart
  def __init__(self):
    self.name = "Employee"
    self.intern = self.intern()
    self.head = self.head()

  def show(self):
    print('Employee List')
    print('Name:', self.name)

  *class intern:                     # currentStart
    def __init__(self):              # assume cursor is somewhere in call intern
      self.name = 'Smith'
      self.Id = '657'

    def display(self):
      print("Name:", self.name)
      print("Id:", self.Id)*         # currentEnd and parentEnd and topScopeEnd

*class TreeNode2:                    # nextStart
  def __init__(self, x):
    self.val = x
    self.left = None*                # nextEnd
```

## `symbol` Options: string or array, optional, default = ["function", "class", "method"]

* function
* class
* method

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

* topScopeStart - the outermost symbol (i.e., its top scope) containing the cursor, may contain nested symbols

* topScopeEnd

## `select` Option: boolean, optional, default = false

The entire symbol (function, class or method) will be selected if `select` is set to `true`.  

The cursor will be positioned at the beginning of those symbols where one of the `....Start` options was used (like `nextStart`).  
The cursor will be positioned at the end of those symbols where one of the `....End` options swas used (like `nextEnd`).  
