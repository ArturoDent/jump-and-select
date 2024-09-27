# Jump and Select

Jump/move the cursor to the next or previous occurrence of some typed character or group of characters (in a keybinding).  
You can also optionally select the text from the current cursor position to that next/previous character while extending the current selection.  
Works with keybindings and macros.  You can use multiple characters in a keybinding or macro.  
Works with multiple cursors.  

-----------

## Notable Changes in v0.6.0

**Deprecated** : The settings  

`jump-and-select.restrictSearch`,  
`jump-and-select.putCursorForward` and  
`jump-and-select.putCursorBackward`  

are all deprecated.  They still work in your `settings.json` but do not show up in Settings UI.  Instead use this setting:

* jump-and-select.defaults    // See more below in Settings.

<img src="https://github.com/ArturoDent/jump-and-select/blob/main/images/settingsUIgif?raw=true" width="600" height="450" alt="Move cursors forward to next character"/>

## Notable Changes in v0.5.0

* In a keybinding, the `text` argument will NOT be interpreted as a regular expression.  This is a **Breaking Change**.  But these limited `text` regular expression queries are allowed:  

```plaintext
       1. "^" : go to start of line,
       2. "$" : go to end of line, and
       3. "^$": go to next or previous empty line.
       
       4. "\\$": go to a literal "$".  See below for more on escaping these characters.
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

#### Using `jump-and-select.jumpBackwardMultiMode` and `jump-and-select.jumpForwardMultiMode` commands:

<img src="https://github.com/ArturoDent/jump-and-select/blob/main/images/multiModeJumping.gif?raw=true" width="700" height="150" alt="Move cursors forward to next character"/>

----------

## Extension Settings  

> &emsp;&emsp;Cursor movement or selections will not "wrap" beyond the start or end of the file.  

> &emsp;&emsp;Searches are case-sensitive.

* `jump-and-select.defaults`

<div style="border: 1px solid; border-radius: 4px; width:fit-content;">

| Setting                  | options                      | Default                     |
|--------------------------|------------------------------|-----------------------------|
| restrictSearch           | document/line                |document                     |
|                          |                              |                             |
| putCursorForwardJump     |beforeCharacter/afterCharacter|beforeCharacter              |
| putCursorForwardSelect   |beforeCharacter/afterCharacter|afterCharacter               |
|                          |                              |                             |
| putCursorBackwardJump    |beforeCharacter/afterCharacter|beforeCharacter              |
| putCursorBackwardSelect  |beforeCharacter/afterCharacte |beforeCharacter              |

</div>
<br/>

* `restrictSearch`

&emsp;&emsp;&emsp;&emsp; `"line"` &nbsp; &nbsp; : &nbsp; Move the cursor or select within the current line only  
&emsp;&emsp;&emsp;&emsp; `"document` &nbsp;&nbsp;: &nbsp; Move the cursor or select within the entire document  

* `putCursorForwardJump`: cursor is moving forward or down in the document

&emsp;&emsp;&emsp;&emsp; `"beforeCharacter"` &nbsp;:&nbsp;&nbsp; Move the cursor to before the next chosen character  
&emsp;&emsp;&emsp;&emsp; `"afterCharacter"` &nbsp;&nbsp; :&nbsp;&nbsp; Move the cursor to after the next chosen character

* `putCursorForwardSelect`: cursor and selection is moving forward or down in the document

&emsp;&emsp;&emsp;&emsp; `"beforeCharacter"` &nbsp;:&nbsp;&nbsp; Select to before the previous chosen character  
&emsp;&emsp;&emsp;&emsp; `"afterCharacter"` &nbsp;&nbsp; :&nbsp;&nbsp; Select to after the previous chosen character  

* `putCursorBackwardJump`: cursor is moving backward or up in the document

&emsp;&emsp;&emsp;&emsp; `"beforeCharacter"` &nbsp;:&nbsp;&nbsp; Move the cursor to before the next chosen character  
&emsp;&emsp;&emsp;&emsp; `"afterCharacter"` &nbsp;&nbsp; :&nbsp;&nbsp; Move the cursor to after the next chosen character

* `putCursorBackwardSelect`: cursor and selection is moving backward or up in the document

&emsp;&emsp;&emsp;&emsp; `"beforeCharacter"` &nbsp;:&nbsp;&nbsp; Select to before the previous chosen character  
&emsp;&emsp;&emsp;&emsp; `"afterCharacter"` &nbsp;&nbsp; :&nbsp;&nbsp; Select to after the previous chosen character

Examples:  

`"putCursorForwardJump": "beforeCharacter"`  if text is&nbsp; `|abcde|f` &nbsp;jumping forward from `a` to `f` would put the cursor before `f`.  

`"putCursorForwardJump": "afterCharacter"`  &nbsp; if text is&nbsp; `|abcdef|` &nbsp;jumping forward from `a` to `f` would put the cursor after `f`.  

Selections will act the same way: either the selection will not include the chosen character (the one you type) or the selection will include that character.  

Example of modified settings (in `settings.json`) after setting the values in the Settings UI (search for "jump"):  

```jsonc
  "jump-and-select.defaults": {
    "putCursorOnForwardSelect": "beforeCharacter",
    "putCursorOnBackwardJump": "afterCharacter"
  }
```

* Note: `beforeCharacter` should really be `beforeQuery` and `afterCharacter` should be `afterQuery`.  The original names are from a time when you could only input one typed character at a time.  But in the keybindings `text` argument you can have multiple characters like `howdy` or `abc\\$` and the cursor will go before or after that entire query.  So think of them as `beforeQuery` and `afterQuery` - which may be a single or multiple characters.

There is a precedence to the option values.  Any option set in a keybinding takes precedence over the `jump-and-select.defaults` setting which takes precedence over the deprecated settings mentioned above.  

-----------------  

## Extension Commands

* `jump-and-select.jumpForward` &emsp; &emsp; &emsp; &nbsp; &nbsp; &nbsp;: &nbsp; Move to the next occurrence of the character. &nbsp; <kbd>Alt</kbd>+<kbd>f</kbd>  

* `jump-and-select.jumpForwardSelect` &nbsp; &nbsp;&nbsp; : &nbsp; Select from the cursor to the next occurrence of the character. &nbsp; <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>f</kbd>  

* `jump-and-select.jumpBackward` &emsp; &emsp; &emsp; &nbsp;&nbsp;: &nbsp; Move to the previous occurrence of the character. &nbsp; <kbd>Alt</kbd>+<kbd>b</kbd>  

* `jump-and-select.jumpBackwardSelect` &nbsp; : &nbsp; Select from the cursor to the previous occurrence of the character. &nbsp; <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>b</kbd>

* `jump-and-select.abortMultiMode` &nbsp; : &nbsp; Abort or leave `multiMode` - to return to regular text entry. No default keybinding.  Appears in the Command Palette (or Keyboard Shortcuts) as `Jump-Select: Abort MultiMode` when `multimode` is active.

When you trigger one of these commands, you will not see the next character you type - instead that character will trigger a search for that character.  A space is considered a character (but oddly tabs are not?), as well as the regular expression characters `^` and `$`.  

-------

### Example Keybindings

You can change the default arguments, like `restrictSearch/putCursorForwardJump/putCursorBackwardJump`/etc , in your `Settings UI`.  Search for `jump-and-select` and you should see these options.

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

    // "putCursorForwardJump" is used if the command is 'jumpForward' or 'jumpForwardMultiMode'
    // "putCursorForwardSelect" is used if the command is 'jumpForwardSelect' or 'jumpForwardSelectMultiMode'
    
    // "putCursorBackwardJump" is used if the command is 'jumpBackward' or 'jumpBackwardMultiMode'
    "putCursorBackwardSelect": "beforeCharacter",   // or "afterCharacter"

    "restrictSearch": "document"              // or "line" to search in the current line only
  }
}
```

In this last example, you would use `putCursorBackwardSelect` and **not** `putCursorForwardSelect` because the command `jumpBackwardSelect` is jumping backward and thus `putCursorForwardSelect` is an error.  For commands that are jumping forward use `putCursorForwardJump` or `putCursorForwardSelect`.  

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

The selection can be expanded forward with either the `jumpForwardSelect` or `jumpForwardSelectMultiMode` command.  
The selection can be expanded backward with either the `jumpBackwardSelect` or `jumpBackwardSelectMultiMode` command.  

This can be done either by triggering the default commands or by triggering a keybinding.

The below demo shows creating a backwards selection to the `(` and then a forwards expansion of that selection to the `)`.

<img src="https://github.com/ArturoDent/jump-and-select/blob/main/images/jumpSelectionExpand1.gif?raw=true" width="800" height="250" alt="Expand the selection to the brackets"/>

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
          "putCursorBackwardSelect": "afterCharacter"
        }
      },
      {
        "command": "jump-and-select.jumpForwardSelect",
        "args": {
          "text": ")",
          "putCursorForwardSelect": "beforeCharacter"
        }
      }
    ]
  },
  // "when": "editorTextFocus && !editorReadonly && editorLangId == rust"
  // "when": "editorTextFocus && !editorReadonly && resourceExtname =~ /\\.(js|ts)/"
}
```

Another example, using a combination of `jump-and-select.jumpBackwardSelectMultiMode` and then this keybinding:

```jsonc
{
  "key": "alt+p",
  "command": "jump-and-select.jumpForwardSelect",
  "args": {
    "text": "^$"   // select to next empty line
  },
}
```

<img src="https://github.com/ArturoDent/jump-and-select/blob/main/images/jumpSelectionExpandEmptyLine.gif?raw=true" width="800" height="300" alt="Error message when fail to exit MultiMode"/>

-------------

## Using regular expressions in a keybinding

With a `"text": ""` argument in a keybinding, you can only use these regular expression patterns: `^`, `$`, or `^$`.  Those will always be evaluated as regular expressions, never as literals.  For example,

```jsonc
{
  "key": "alt+p",
  "command": "jump-and-select.jumpForward",
  "args": {
    "text": "^",  // go to start of line
    // "text": "$",  // go to end of line
    // "text": "^$",  // go to next/previous empty line
    // "restrictSearch": "line"   // or document
  },
}
```

* Note, you can also use `^` and `$` as key inputs to any of the commands outside of a keybinding - they will also be interpreted as regular expression characters.

If you want to jump to a literal `^` or `$`, you will need to put them into a keybinding and double-escape them like so:

```jsonc
{
  "key": "alt+p",
  "command": "jump-and-select.jumpForward",
  "args": {
    "text": "howdy\\$",  // "123\\^" or "\\^\\$" also work, 
  }
}
```

You can have any number of double-escaped `\\^` and `\\$` mixed with other text and it will all be treated as literal (non-regular expression) characters.  

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

---------

* Note: `^` or `$` or `^$` also work to expand existing selections.  It is easiest to set up a simple keybinding like

```jsonc
{
  "key": "alt+p",
  "command": "jump-and-select.jumpForwardSelect",  // and try the other commands
  "args": {
    
    "text": "^",
    // "text": "$", 
    // "text": "^$", 
    
    "restrictSearch": "document"  // the default so not necessary
    // "restrictSearch": "line"
  },
  // "when": ""
}
```

to see how they work in action.  

---------------

## StatusBar colors

Color options for the StatusBarItem are very limited.  Right now these are the settings you can modify:

```jsonc
"workbench.colorCustomizations": {

   // errorBackground and warningBackground are the only background colors supported by vscode for statusBarItems
   // this extension uses the errorBackground (warning was not originally supported)
   
  "statusBarItem.errorBackground": "#fff",            // default is red
  "statusBarItem.errorForeground": "#000",            // default is white
  
  "statusBarItem.errorHoverBackground": "#000",       // affects the error statusBarItems only
  "statusBarItem.errorHoverForeground": "#ff0000",    // affects the error statusBarItems only
  
  // or
  
  "statusBarItem.hoverBackground": "#000",            // affects all statusBarItems
  "statusBarItem.hoverForeground": "#fff",            // affects all statusBarItems
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
2.  options in settings;
3.  and options in the deprecated settings;
4.  no options in  (1), (2) or (3).

The options take precedence in that order: 1 > 2 > 3 > 4.  All the options have defaults, so even in case (4) the default values will be applied.

------------------

#### 1. &nbsp; If after triggering one of the commands you decide you don't want to move the cursor after all, <kbd>Enter</kbd> will exit the command and you can resume typing.  

#### 2. &nbsp; If after triggering one of the commands you decide you want to move the cursor first, <kbd>left/rightArrow</kbd> keys or clicking in the file elsewhere will move the cursor without exiting the command.  You can then type a chosen character to move/select from the new cursor position.  

#### 3. &nbsp; If the next or previous jump would be out of the editor's viewport, it will be revealed.  For multiple selections, the first selection made (which could appear after other selections) will be revealed.

----------------

## Known Issues

This extension may not play well with vim or neovim or similar due to registering the same `'type'` command as those extensions do.  However, this extension disposes of that binding immediately after typing one character so it may not be an issue...  

For some unknown reason, tabs (`\t`) are not considered a typed character and don't work.  Spaces do work though.  

## TODO  
  
[  ] - Explore allowing input via 'paste' as well.  
[  ] - Consider adding a setting to make queries be interpreted as regex's in keybindings.  
[  ] - Consider cancelling multiMode if change editor.  
[  ] - Should there be a notification for no match on a query?  

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

* 0.5.0&emsp; Removed regex interpretation of keybinding queries.  
&emsp;&emsp; &emsp; Selections are continuous - extending each current selection, even with `^/$/^$`.  
&emsp;&emsp; &emsp; Make all jumps reveal - at bottom.  
&emsp;&emsp; &emsp; Fix putCursorForward/Backward if next to a match.  
&emsp;&emsp; &emsp; Make the StatusBarItem show immediately.  
&emsp;&emsp; &emsp; Add `Abort MultiMode` command.  In Command Palette and clicking the StatusBarItem.  
&emsp;&emsp; &emsp; Prevent multiple StatusBarItems.  
&emsp;&emsp; &emsp; Swapped JSON Schema `keybindings.schema.jsonc` instead of CompletionProvider.  
&emsp;&emsp; &emsp; Better `^`, `$`, and `^$` selecting in keybindings.  
&emsp;&emsp; &emsp; Enable literal `\\^`and `\\$` in keybindings.  
&emsp;&emsp; &emsp; Simplified the QueryObject and made a default noMatch.  
&emsp;&emsp; &emsp; Use EOL length for forward ^/$ for multi-OS lengths.  
&emsp;&emsp; &emsp; Made a Discussions item for new features.  
0.5.2&emsp; Fix backwards bug not using start of first line.  
0.5.3&emsp; empty line (^$) jumps work in files that DON'T normalize \n to \r\n - specific settings-type files.  
0.5.4&emsp; empty line (^$) "fix" - just check for existence of \r\n in tthe file to set which regex to use.  

* 0.6.0&emsp; Deprecated all previous settings in favor of one `defaults`.  
&emsp;&emsp; &emsp; Added a jump and a select version of each option.  
&emsp;&emsp; &emsp; For "^$" just use /(?<=\r?\n)\r?\n/g)/ regex.  
&emsp;&emsp; &emsp; Use more "editor.document.eol" for match and query lengths.  
&emsp;&emsp; &emsp; Added configs.js with `defaults.restrictSearch ?? depRestrictSearch ?? "document"`, for example.  

-----------------------------------------------------------------------------------------------------------
