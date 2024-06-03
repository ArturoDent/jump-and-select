# Jump and Select

Jump/move the cursor to the next or previous occurrence of some character.  
You can also optionally select the text from the current cursor position to that next/previous character.  
Works with keybindings and macros.  You can use multiple characters in a keybinding or macro.  
Works with multiple cursors.  

-----------

## Notable Changes in v0.1.0

* In a keybinding, the `text` argument will NOT be interpreted as a regular expression.  This is a **Breaking Change**.  But these limited `text` queries are allowed:  

```plaintext
       1. "^" : go to start of line,
       2. "$" : go to end of line, and
       3. "^$": go to next or previous empty line.
```

See [Using regular expressions in a keybinding](#using-regular-expressions-in-a-keybinding).

* Selections are now cumulative.  So jumping and selecting will extend the current selection.  Demo below.

* Jumps to text outside of the viewport will be revealed - i.e., the file will be scrolled to show the forward/backward jump.

* Added a command: `Jump-Select: Abort MultiMode` so can click StatusBarItem or Command Palette command to cancel `multiMode`.

See the [GitHub Discussions](https://github.com/ArturoDent/jump-and-select/discussions) to provide input on new features.

--------

## How It Works  

### Choose one of your keybindings, say <kbd>Alt</kbd>+<kbd>f</kbd> to jump forward.  

1.  Trigger that command: <kbd>Alt</kbd>+<kbd>f</kbd>,  
2.  Type a character (it will not be shown), and  
3.  Cursor moves to that next character.  

<img src="https://github.com/ArturoDent/jump-and-select/blob/main/images/jumpIntro1.gif?raw=true" width="700" height="100" alt="Move cursors forward to next character"/>

### Using `jump-and-select.jumpBackwardMultiMode` and `jump-and-select.jumpForwardMultiMode` commands:

<img src="https://github.com/ArturoDent/jump-and-select/blob/main/images/multiModeJumping.gif?raw=true" width="700" height="150" alt="Move cursors forward to next character"/>

----------

## Extension Settings  

> &emsp;&emsp;Cursor movement or selections will not "wrap" beyond the start or end of the file.  

> &emsp;&emsp;Searches are case-sensitive.

* `jump-and-select.restrictSearch`  &emsp; :  &emsp; default = `"document"`

&emsp;&emsp;&emsp;&emsp; `"line"` &nbsp; &nbsp; : &nbsp; Move the cursor or select within the current line only  
&emsp;&emsp;&emsp;&emsp; `"document` &nbsp;&nbsp;: &nbsp; Move the cursor or select within the entire document  

* `jump-and-select.putCursorForward` &emsp; :  &emsp; default = `"beforeCharacter"`

&emsp;&emsp;&emsp;&emsp; `"beforeCharacter"` &nbsp;:&nbsp;&nbsp; Move the cursor or select to before the next chosen character  
&emsp;&emsp;&emsp;&emsp; `"afterCharacter"` &nbsp;&nbsp; :&nbsp;&nbsp; Move the cursor or select to after the next chosen character

* `jump-and-select.putCursorBackward` &emsp; :  &emsp; default = `"beforeCharacter"`

&emsp;&emsp;&emsp;&emsp; `"beforeCharacter"` &nbsp;:&nbsp;&nbsp; Move the cursor or select to before the previous chosen character  
&emsp;&emsp;&emsp;&emsp; `"afterCharacter"` &nbsp;&nbsp; :&nbsp;&nbsp; Move the cursor or select to after the previous chosen character

Examples:  

`"jump-and-select.putCursorForward": "beforeCharacter"`  if text is&nbsp; `|abcde|f` &nbsp;jumping forward from `a` to `f` would put the cursor before `f`.  

`"jump-and-select.putCursorForward": "afterCharacter"`  &nbsp; if text is&nbsp; `|abcdef|` &nbsp;jumping forward from `a` to `f` would put the cursor after `f`.  

Selections will act the same way: either the selection will not include the chosen character (the one you type) or the selection will include that character.  

Example of the three settings (in `settings.json`):  

```jsonc
  "jump-and-select.restrictSearch"        :      "line",
  "jump-and-select.putCursorForward"      :      "beforeCharacter",
  "jump-and-select.putCursorBackward"     :      "afterCharacter",
```

-----------------  

## Extension Commands

* `jump-and-select.jumpForward` &emsp; &emsp; &emsp; &nbsp; &nbsp; &nbsp;: &nbsp; Move to the next occurrence of the character. &nbsp; <kbd>Alt</kbd>+<kbd>f</kbd>  

* `jump-and-select.jumpForwardSelect` &nbsp; &nbsp;&nbsp; : &nbsp; Select from the cursor to the next occurrence of the character. &nbsp; <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>f</kbd>  

* `jump-and-select.jumpBackward` &emsp; &emsp; &emsp; &nbsp;&nbsp;: &nbsp; Move to the previous occurrence of the character. &nbsp; <kbd>Alt</kbd>+<kbd>b</kbd>  

* `jump-and-select.jumpBackwardSelect` &nbsp; : &nbsp; Select from the cursor to the previous occurrence of the character. &nbsp; <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>b</kbd>

* `jump-and-select.abortMultiMode` &nbsp; : &nbsp; Abort or leave `multiMode` - to return to regular text entry. No default keybinding.  Appears in the Command Palette (or Keyboard Shortcuts) as `Jump-Select: Abort MultiMode` when `multimode` is active.

When you trigger one of these commands, you will not see the next character you type - instead that character will trigger a search for that character.  

-------

### Example Keybindings

You can change the default arguments, like `restrictSearch/putCursorForward/putCursorBackward` , in your `Settigns UI`.  Search for `jump-and-select` and you should see these options.

You can set the command arguments like this in your `keybindings.json` and these will override the settings defaults for these keybindings:  

```jsonc
{
  "key": "alt+f",                  // <== change this to whatever you want
  "command": "jump-and-select.jumpForward"
  // "when": "editorTextFocus && editorLangId == javascript"  // for example
}
```  

```jsonc
{
  "key": "alt+r",
  "command": "jump-and-select.jumpBackwardSelect",
  "args": {

    // the args that can be used in a keybinding

    "text": "hello",                           // no default

    // "putCursorForward" is used if the command is 'jumpForward..."
    // "putCursorForward": "afterCharacter"   // or "beforeCharacter"
    
    // "putCursorBackward" is used if the command is 'jumpBackward..."
    "putCursorBackward": "beforeCharacter",   // or "afterCharacter"

    "restrictSearch": "document"              // or "line" to search in the current line only
  }
}
```

In this last example, you would use `putCursorBackward` and **not** `putCursorForward` because the command `jumpBackwardSelect` is jumping backward and thus `putCursorForward` is ignored.  For commands that are jumping forward use `putCursorForward`.  

The available `args` have the same names as the settings, like `"jump-and-select.putCursorForward"` minus the extension name prefix.  

For more on using **[keybindings and macros](keybindings.md)**.  

------------

## Multimode Commands  

What is `MultiMode`?  It means you can trigger the command ONCE and then move/select as many times as you want.  

A clickable button appears in the Status Bar to indicate that to exit/stop the command and get back to normal text insertion/deletion you can exit `multiMode` by hitting the <kbd>Return</kbd> (unfortunately <kbd>Escape</kbd> will **not work**).  That Status Bar reminder will hide when you do exit the command successfully and reappear the next time you invoke a MultiMode command.  

You can also exit `multiMode` by clicking on the StatusBarItem or by invoking the command `Jump-Select: Abort MultiMode` (`jump-and-select.abortMultiMode`) either from a keybinding you set up or through the Command Palette.  

* `jump-and-select.jumpForwardMultiMode` &emsp; &emsp; &emsp; &nbsp; &nbsp; &nbsp;: &nbsp; Move to the next occurrence of the character. &nbsp; <kbd>Alt</kbd>+<kbd>m</kbd> &nbsp; <kbd>Alt</kbd>+<kbd>f</kbd>  

* `jump-and-select.jumpForwardSelectMultiMode` &nbsp; &nbsp;&nbsp; : &nbsp; Select from the cursor to the next occurrence of the character. &nbsp; <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>m</kbd> &nbsp; <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>f</kbd>  

* `jump-and-select.jumpBackwardMultiMode` &emsp; &emsp; &emsp; &nbsp;&nbsp;: &nbsp; Move to the previous occurrence of the character. &nbsp; <kbd>Alt</kbd>+<kbd>m</kbd> &nbsp; <kbd>Alt</kbd>+<kbd>b</kbd>  

* `jump-and-select.jumpBackwardSelectMultiMode` &nbsp; : &nbsp; Select from the cursor to the previous occurrence of the character. &nbsp; <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>m</kbd> &nbsp; <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>b</kbd>  

To trigger <kbd>Alt</kbd>+<kbd>m</kbd> &nbsp; <kbd>Alt</kbd>+<kbd>f</kbd> you can hold down the <kbd>Alt</kbd> key and then hit <kbd>m</kbd> and then <kbd>f</kbd> and release and MultiMode is running.  These are just suggested keybindings, use whatever you want.  Think of <kbd>Alt</kbd>+<kbd>m</kbd> as standing for MultiMode.

Once you are in `multiMode` you can move the cursor anywhere you want and continue to jump from that new position.  

---------

## Expanding the Selection

If you already have a selection or create one with one of the 'Select' commands (`jumpForwardSelect`, `jumpForwardSelectMultiMode`, `jumpBackwardSelect`, or `jumpBackwardSelectMultiMode`) and do another 'select' command that pre-existing selection will be expanded.

The below demo shows creating a backwards selection to the `(` and then a forwards expansion of that selection to the `)`.

<img src="https://github.com/ArturoDent/jump-and-select/blob/main/images/jumpExpandSelection1.gif?raw=true" width="700" height="150" alt="Expand the selection to the brackets"/>

Here is a single keybinding combining the two operations from above.

```jsonc
{
  "key": "alt+t",
  "command": "runCommands",
  "args": {
    "commands": [
      {
        "command": "jump-and-select.jumpBackwardSelect",
        "args": {
          "text": "(",
          "putCursorBackward": "afterCharacter"
        }
      },
      {
        "command": "jump-and-select.jumpForwardSelect",
        "args": {
          "text": ")",
          "putCursorBackward": "beforeCharacter"
        }
      }
    ]
  },
  // "when": "editorTextFocus && !editorReadonly && editorLangId == rust"
  // "when": "editorTextFocus && !editorReadonly && resourceExtname =~ /\\.(js|ts)/"
}
```

-------------

## Using regular expressions in a keybinding

With a `"text": ""` argument, you can only use these regular expression patterns: `^`, `$`, or `^$`.  For example,

```jsonc
{
  "key": "alt+p",
  "command": "jump-and-select.jumpForward",
  "args": {
    "text": "^",
    // "putCursorBackward": "beforeCharacter",   // "putCursorBackward" is ignored when using ^, $ or ^$
    // "restrictSearch": "line"   // or document
  },
}
```

A. **With one of the `jumpForward...` commands:**

**` "restrictSearch": "document" ` or no `restrictSearch` argument (`document` is the default):**

1. "^" : the cursor would go to the start of the next line - that is forwards.  If the cursor is already at the start of a line: it will go to the start of the next line.
2. "$" : the cursor would go to the end of the current line.  If the cursor is already at the end of a line: it will go to the end of the next line.
3. "^$" : the cursor would go to the next empty line.

##### ` "restrictSearch": "line" `:

1. "^" : nothing would happen. Can't go forward to the start of the same line.
2. "$" : the cursor will go to the end of the current line.
3. "^$" : nothing would happen.  Never leave the current line.

------------

**2. With one of the `jumpBackward...` commands:**

##### ` "restrictSearch": "document" ` or no `restrictSearch` argument (`document` is the default):

1. "^" : the cursor would go to the start of the current line - that is backwards.  If the cursor is already at the start of a line: it will go to the start of the previous line.
2. "$" : the cursor would go to the end of the current line.  If the cursor is already at the end of a line: it will go to the end of the previous line.
3. "^$" : the cursor would go to the previous empty line.

##### ` "restrictSearch": "line" `:

1. "^" : the cursor will go to the start of the current line - that is backwards.
2. "$" : nothing would happen.  Can't go backward to the end of the same line.
3. "^$" : nothing would happen.  Never leave the current line.

The arguments `putCursorForward` or `putCursorBackward` are ignored when using `^`, `$` or `^$`.

---------------

## StatusBar colors

Color options for the StatusBarItem are very limited.  Right now you can use these settings:

```jsonc
"workbench.colorCustomizations": {

  "statusBarItem.errorBackground": "#fff",   // yes, errorBackground is the only background color supported
  "statusBarItem.errorForeground": "#000",
  "statusBarItem.hoverBackground": "#ff0000",
  
  "statusBarItem.prominentBackground": "#ff0000",
  "statusBarItem.prominentForeground": "#fff",
}
```

The `errorBackground` default is `#f00` or red.  Changing it will change the errorBackground color for all extensions or vscode itself that provide a StatusBarItem that needs an errorBackground.  In this demo I left the settings at their default values.

If you see this error message you may have forgotten to exit (via the <kbd>Enter</kbd>) the MultiMode and tried to initiate some other `jump-and-select` command:  

<img src="https://github.com/ArturoDent/jump-and-select/blob/main/images/multiModeError.jpg?raw=true" width="500" height="100" alt="Error message when fail to exit MultiMode"/>

------------------------

### `"restrictSearch": "line"` option and selections

If you have `"restrictSearch": "line"` and have an existing selection in the code and then trigger one of the commands, what exactly is considered to be the 'line'?  

The one 'line' will be where the cursor is - this is known as the `active` end of the selection.  So if you make a multiline selection first, the one 'line' will be where the end of the selection is that has the active cursor.

Also, when this selection searches forward on a line, it will do so **FROM** the cursor.  Likewise, if it is searching backward on a 'line' with a selection, it will search backwards from the position of the active cursor.

----------

### A note on the precedence of the options.  

We have seen that there are three possibilities for the options (like `"restrictSearch"` for example):  

1.  options in a keybinding;
2.  options in settings; and
3.  no options in either (1) or (2).

The options take precedence in that order: 1 > 2 > 3.  All the options have defaults, so even in case (3) the default values will be applied.

------------------

#### 1. &nbsp; If after triggering one of the commands you decide you don't want to move the cursor after all, <kbd>Enter</kbd> will exit the command and you can resume typing.  

#### 2. &nbsp; If after triggering one of the commands you decide you want to move the cursor first, <kbd>left/rightArrow</kbd> keys or clicking in the file elsewhere will move the cursor without exiting the command.  You can then type a chosen character to move/select from the new cursor position.  

#### 3. &nbsp; If the next or previous jump would be out of the editor's viewport, it will be revealed.  For multiple selections, the first selection made (which could appear after other selections) will be revealed.

----------------

## Known Issues

This extension may not play well with vim or neovim or similar due to registering the same `'type'` command as those extensions do.  However, this extension disposes of that binding immediately after typing one character so it may not be an issue...  

## TODO  
  
[&emsp; ] - Explore allowing input via 'paste' as well.  
[&emsp; ] - Consider adding a setting to make queries be interpreted as regex's in keybindings.  
[&emsp; ] - Consider cancelling multiMode if change editor.
[&emsp; ] - Should there be a notification for no match on a query?
[&emsp; ] - Should before/afterCharacter do something for "^$"?

## Release Notes  

* 0.0.1 &emsp;  Initial release of `jump-and-select` extension.  

* 0.0.2 &emsp;  Change behavior of go to previous character, put cursor before the character.

* 0.0.41&emsp;Added setting to restrict movement/selection to current line or full document.  
&emsp;&emsp; &emsp; Added setting to move/select before or after the chosen character.  
&emsp;&emsp; &emsp; Separated settings to put cursor before/after the chosen character for both forward/backward.  
&emsp;&emsp; &emsp; Added support for keybindings and all args therein.  
&emsp;&emsp; &emsp; Added support for regular expressions in keybindings and macros.  
&emsp;&emsp; &emsp; Renamed to `restrictSearch` setting and `args` option.  
&emsp;&emsp; &emsp; Added intellisense/completions for keybindings, including `args` options.

* 0.1.0&emsp; Removed regex interpretation of keybinding queries.  
&emsp;&emsp; &emsp; Selections are continuous - extending each current selection.  
&emsp;&emsp; &emsp; Make all jumps reveal - at bottom.  
&emsp;&emsp; &emsp; Fix putCursorForward/Backward if next to a match.  
&emsp;&emsp; &emsp; Make the StatusBarItem show immediately.  
&emsp;&emsp; &emsp; Add `Abort MultiMode` command.  In Command Palette and clicking the StatusBarItem.  
&emsp;&emsp; &emsp; Prevent multiple StatusBarItems.  
&emsp;&emsp; &emsp; Swapped JSON Schema `keybindings.schema.jsonc` for CompletionProvider.  
&emsp;&emsp; &emsp; Better `^`, `$`, and `^$` selecting in keybindings.  
&emsp;&emsp; &emsp; Simplified the QueryObject and made a default noMatch.

&emsp;&emsp; &emsp; Better Made a Discussions item for new features.

-----------------------------------------------------------------------------------------------------------
