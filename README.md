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

* #### `jump-and-select.restrictToCurrentLine`  &emsp; :  &emsp; { boolean } &emsp; default = `false`

&emsp;&emsp;&emsp;&emsp; `true` &nbsp; &nbsp; : &nbsp; Move the cursor or select within the current line only   
&emsp;&emsp;&emsp;&emsp; `false` &nbsp;&nbsp;: &nbsp; Move the cursor or select within the entire document  

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
	"jump-and-select.restrictToCurrentLine" :      false,
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

When you trigger one of these commands, you will not see the next character you type - instead that character will trigger a search for that character. 

The bindings listed above are default keybindings, you can change them like this in your `keybindings.json`:  

```jsonc
{
  "key": "alt+f",                  // <== change this to whatever you want
  "command": "jump-and-select.jumpForward"
  // "when": "editorTextFocus && editorLangId == javascript"  // for example
}
```


------------------

<br/> 

### 1. &nbsp; If after triggering one of the commands you decide you don't want to move the cursor after all, <kbd>Enter</kbd> will exit the command and you can resume typing.  

<br/>

### 2. &nbsp; If after triggering one of the commands you decide you want to move the cursor first, <kbd>left/rightArrow</kbd> keys or clicking in the file elsewhere will move the cursor without exiting the command.  You can then type a chosen character to move/select from the new cursor position.  

<br/>

----------------


## Known Issues

This extension may not play well with vim or neovim or similar due to registering the same `'type'` command as those extensions do.  However, this extension disposes of that binding immediately after typing one character so it may not be an issue...

## TODO  
  
[ X ] - Explore a setting for setting cursor prior to or after typed character.    
[ X ] - Explore use of text arg in keybindings (including macros).  
[ X ] - Explore use of `beforeCharacter` and `afterCharacter` arg in keybindings (including macros).   
[ X ] - Explore use of multi-character queries in macros or keybindings.
[&emsp; ] - Add a StatusBarItem reminder for multi-mode.   
[&emsp; ] - Add intellisense for keybindings.   
[&emsp; ] - Explore allowing input via 'paste' as well.      
[&emsp; ] - Add a setting to make searches case-insensitive, if requested.  
[&emsp; ] - Add handling of special regex characters `^` and `$` if they are not in the text.

## Release Notes  

* 0.0.1 &emsp;  Initial release of `jump-and-select` extension.  

* 0.0.2 &emsp;  Change behavior of go to previous character, put cursor before the character.

* 0.0.3 &emsp;  Added setting to restrict movement/selection to current line or full document.  
&emsp;&emsp; &emsp; Added setting to move/select before or after the chosen character.  

* 0.0.4 &emsp;  Separated settings to put cursor before/after the chosen character for both forward/backward.    
&emsp;&emsp; &emsp; Added support for keybindings and all args therein.  






-----------------------------------------------------------------------------------------------------------