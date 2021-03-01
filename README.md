# Jump and Select

Jump/move the cursor to the next or previous occurrence of some character.  
You can also optionally select the text from the current cursor position to that next/previous character.  
Works with keybindings and macros.  You can use multiple characters in a keybinding or macro.  
Works with multiple cursors.  


<br/>

-----------


## How It Works  
<br/>

Choose one of your keybindings, say <kbd>Alt</kbd>+<kbd>f</kbd> to jump forward.  

1.  Trigger that command: <kbd>Alt</kbd>+<kbd>f</kbd>,   
2.  Type a character (it will not be shown), and     
3.  Cursor moves to that next character.  

<img src="https://github.com/ArturoDent/jump-and-select/blob/master/images/jumpIntro.gif?raw=true" width="700" height="300" alt="Move cursors forward to next character"/>

----------

## Extension Settings  

<br/>

> &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Cursor movement or selections will not "wrap" beyond the start or end of the file.  

> &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Searches are case-sensitive.

<br/>  

* #### `jump-and-select.restrictSearch`  &emsp; :  &emsp; { boolean } &emsp; default = `"document"`

&emsp;&emsp;&emsp;&emsp; `"line"` &nbsp; &nbsp; : &nbsp; Move the cursor or select within the current line only   
&emsp;&emsp;&emsp;&emsp; `"document` &nbsp;&nbsp;: &nbsp; Move the cursor or select within the entire document  

<br/>

* #### `jump-and-select.putCursorForward` &emsp; :  &emsp; { string } &emsp; default = `"beforeCharacter"`

&emsp;&emsp;&emsp;&emsp; `"beforeCharacter"` &nbsp;:&nbsp;&nbsp; Move the cursor or select to before the next chosen character    
&emsp;&emsp;&emsp;&emsp; `"afterCharacter"` &nbsp;&nbsp; :&nbsp;&nbsp; Move the cursor or select to after the next chosen character

<br/>

* #### `jump-and-select.putCursorBackward` &emsp; :  &emsp; { string } &emsp; default = `"beforeCharacter"`

&emsp;&emsp;&emsp;&emsp; `"beforeCharacter"` &nbsp;:&nbsp;&nbsp; Move the cursor or select to before the previous chosen character  
&emsp;&emsp;&emsp;&emsp; `"afterCharacter"` &nbsp;&nbsp; :&nbsp;&nbsp; Move the cursor or select to after the previous chosen character

<br/>

Examples:  

`"jump-and-select.putCursorForward": "beforeCharacter"`  if text is&nbsp; `|abcde|f` &nbsp;jumping forward from `a` to `f` would put the cursor before `f`.  

`"jump-and-select.putCursorForward": "afterCharacter"`  &nbsp; if text is&nbsp; `|abcdef|` &nbsp;jumping forward from `a` to `f` would put the cursor after `f`.  

<br/>

Selections will act the same way: either the selection will not include the chosen character (the one you type) or the selection will include that character.  

Example of the three settings (in `settings.json`):   

```jsonc
	"jump-and-select.restrictSearch"        :      "line",
	"jump-and-select.putCursorForward"      :      "beforeCharacter",
	"jump-and-select.putCursorBackward"     :      "afterCharacter",
```

-----------------  

## Extension Commands

<br/>

* #### `jump-and-select.jumpForward` &emsp; &emsp; &emsp; &nbsp; &nbsp; &nbsp;: &nbsp; Move to the next occurrence of the character. &nbsp; <kbd>Alt</kbd>+<kbd>f</kbd>   

* #### `jump-and-select.jumpForwardSelect` &nbsp; &nbsp;&nbsp; : &nbsp; Select from the cursor to the next occurrence of the character. &nbsp; <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>f</kbd> 

* #### `jump-and-select.jumpBackward` &emsp; &emsp; &emsp; &nbsp;&nbsp;: &nbsp; Move to the previous occurrence of the character. &nbsp; <kbd>Alt</kbd>+<kbd>b</kbd> 

* #### `jump-and-select.jumpBackwardSelect` &nbsp; : &nbsp; Select from the cursor to the previous occurrence of the character. &nbsp; <kbd>Shift</kbd>+<kbd>b</kbd>

<br/>

### &emsp;&emsp; Multimode Commands  
<br/>  

What is `MultiMode`?  It means you can trigger the command ONCE and then move/select as many times as you want.  Demo:


A reminder in the Status Bar appears that the only way to exit/stop the command and get back to normal text insertion/deletion is to exit the command by hitting the <kbd>Return</kbd> (unfortunately <kbd>Escape</kbd> will **not work**).  That Status Bar reminder will hide when you do exit the command successfully and reappear the next time you invoke a MultiMode command.  

<br/>  

* #### `jump-and-select.jumpForwardMultiMode` &emsp; &emsp; &emsp; &nbsp; &nbsp; &nbsp;: &nbsp; Move to the next occurrence of the character. &nbsp; <kbd>Alt</kbd>+<kbd>m</kbd> &nbsp; <kbd>Alt</kbd>+<kbd>f</kbd>   

* #### `jump-and-select.jumpForwardSelectMultiMode` &nbsp; &nbsp;&nbsp; : &nbsp; Select from the cursor to the next occurrence of the character. &nbsp; <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>m</kbd> &nbsp; <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>f</kbd> 

* #### `jump-and-select.jumpBackwardMultiMode` &emsp; &emsp; &emsp; &nbsp;&nbsp;: &nbsp; Move to the previous occurrence of the character. &nbsp; <kbd>Alt</kbd>+<kbd>m</kbd> &nbsp; <kbd>Alt</kbd>+<kbd>b</kbd> 

* #### `jump-and-select.jumpBackwardSelectMultiMode` &nbsp; : &nbsp; Select from the cursor to the previous occurrence of the character. &nbsp; <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>m</kbd> &nbsp; <kbd>Shift</kbd>+<kbd>b</kbd>  

<br/>

To trigger <kbd>Alt</kbd>+<kbd>m</kbd> &nbsp; <kbd>Alt</kbd>+<kbd>f</kbd> you can hold down the <kbd>Alt</kbd> key and then hit <kbd>m</kbd> and then <kbd>f</kbd> and release and MultiMode is running.  These are just suggested keybindings, use whatever you want.  Think of <kbd>Alt</kbd>+<kbd>m</kbd> as standing for MultiMode.

Color options for the StatusBarItem are pretty limited.  Right now you can use these three settings:

```jsonc
"workbench.colorCustomizations": {

	"statusBarItem.errorBackground": "#fff",   // yes, errorBackground is the only background color supported
	"statusBarItem.errorForeground": "#000"
	"statusBarItem.hoverBackground": "#ff0000",
}
```

The `errorBackground` default is `#f00` or red.  Changing it will change the errorBackground color for all extensions or vscode itself that provide a StatusBarItem that needs an errorBackground.  In this demo I left the settings at their default values.

<br/>

If you see this error message you may have forgotten to exit (via the <kbd>Enter</kbd>) the MultiMode and tried to initiate some other `jump-and-select` command:  

<img src="https://github.com/ArturoDent/jump-and-select/blob/master/images/multiModeError.jpg?raw=true" width="700" height="300" alt="Error message when fail to exit MultiMode"/>

------------------------

When you trigger one of these commands, you will not see the next character you type - instead that character will trigger a search for that character. 

The bindings listed above are default keybindings, you can change them like this in your `keybindings.json`:  

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

    // the four args that can be used in a keybinding

    "text": "hello",                          // <== can use strings or regexp's here
    // "text": "#\\d+\n"                      //  double-escaped where necessary		                                      

    // "putCursorForward": "afterCharacter"   // or "beforeCharacter"
    "putCursorBackward": "beforeCharacter",   // or "afterCharacter"

    "restrictSearch": "document"              // or "line" to search in the current line only
  }
}
```

In this last example, you would use `putCursorBackward` and **not** `putCursorForward` because the command `jumpBackwardSelect` is searching backward and thus `putCursorForward` is ignored.  For commands that are looking forward use `putCursorForward`.  

The available `args` have the same names as the settings, like `"jump-and-select.putCursorForward"` minus the extension name prefix.  

For more on using **[keybindings and macros](keybindings.md)**.

--------------------

### A note on the precedence of the options.  

We have seen that there are three possibilities for the options (like `"restrictSearch"` for example):  

1.  options in a keybinding or macro;
2.  options in settings; and
3.  no options in either (1) or (2).

The options take precedence in that order: 1 > 2 > 3.  All the options have defaults, so even in case (3) the default values will be applied.


------------------

<br/> 

### 1. &nbsp; If after triggering one of the commands you decide you don't want to move the cursor after all, <kbd>Enter</kbd> will exit the command and you can resume typing.  

<br/>

### 2. &nbsp; If after triggering one of the commands you decide you want to move the cursor first, <kbd>left/rightArrow</kbd> keys or clicking in the file elsewhere will move the cursor without exiting the command.  You can then type a chosen character to move/select from the new cursor position.  

<br/>

----------------


## Known Issues

This extension may not play well with vim or neovim or similar due to registering the same `'type'` command as those extensions do.  However, this extension disposes of that binding immediately after typing one character so it may not be an issue... 

Small intellisense issue in keybindings.  If you highlight an existing option and then <kbd>Ctrl</kbd>+<kbd>Space</kbd> it does not give you the option of the existing highlighted option (seeing it as already used).  

## TODO  
  
[ X ] - Explore a setting for moving cursor before or after typed character.    
[ X ] - Explore use of text arg in keybindings (including macros).  
[ X ] - Explore use of `beforeCharacter` and `afterCharacter` arg in keybindings (including macros).   
[ X ] - Explore use of multi-character queries in macros or keybindings.  
[ X ] - Explore use of regexp queries in macros or keybindings.   
[ X ] - Add a StatusBarItem reminder for multiMmode.   
[ X ] - Add intellisense for keybindings.   
[&emsp; ] - Explore allowing input via 'paste' as well.      
[&emsp; ] - Add a setting to make searches case-insensitive, **if requested**.  

## Release Notes  

* 0.0.1 &emsp;  Initial release of `jump-and-select` extension.  

* 0.0.2 &emsp;  Change behavior of go to previous character, put cursor before the character.

* 0.0.3 &emsp;  Added setting to restrict movement/selection to current line or full document.  
&emsp;&emsp; &emsp; Added setting to move/select before or after the chosen character.  

* 0.0.4 &emsp;  Separated settings to put cursor before/after the chosen character for both forward/backward.    
&emsp;&emsp; &emsp; Added support for keybindings and all args therein.  
&emsp;&emsp; &emsp; Added support for regular expressions in keybindings and macros.  
&emsp;&emsp; &emsp; Renamed to `restrictSearch` setting and `args` option.  
&emsp;&emsp; &emsp; Added intellisense/completions for keybindings, including `args` options.






-----------------------------------------------------------------------------------------------------------