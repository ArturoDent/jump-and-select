# jump-and-select

Jump/move the cursor to the next or previous occurrence of some character.  
You can also optionally select the text from the current cursor position to that next/previous character.  
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

> &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Cursor movement or selections will not "wrap" beyond the start or end of file.  

> &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Searches are case-sensitive.

<br/>  

* **jump-and-select.restrictToCurrentLine**  &emsp; -  &emsp; Boolean, &emsp; **default = `false`**

&emsp;&emsp;&emsp;&emsp; Move the cursor or select within the current line only =  `true`   
&emsp;&emsp;&emsp;&emsp; Move the cursor or select within the entire document =   `false`  


* **jump-and-select.putCursor** &emsp; -  &emsp; string, &emsp; **default = "beforeCharacter"**

&emsp;&emsp;&emsp;&emsp; Move the cursor or select to before the chosen character =  "beforeCharacter"   
&emsp;&emsp;&emsp;&emsp; Move the cursor or select to after the chosen character =   "afterCharacter"  

If &nbsp; `"jump-and-select.putCursor" : "beforeCharacter"`  and text is &nbsp; `abcdef` &nbsp; jumping forward from `a` to `f` would put the cursor just before `f`.  

If &nbsp; `"jump-and-select.putCursor" : "afterCharacter"`  and text is &nbsp; `abcdef` &nbsp; jumping forward from `a` to `f` would put the cursor just after `f`.   

Selections will act the same way: either the selection will not include the chosen character (the one you type) or the selection will include that character.

-----------------  

## Extension Commands

* **jump-and-select.jumpForwardOnly**   &emsp; - &emsp; Moves to the next occurrence of the character.
&emsp; <kbd>Alt</kbd>+<kbd>f</kbd>   

* **jump-and-select.jumpForwardSelect**   &emsp; - &emsp; Selects from the cursor to the next occurrence of the character.
&emsp; <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>f</kbd> 

* **jump-and-select.jumpBackwardOnly**   &emsp; - &emsp; Moves to the previous occurrence of the character. 
&emsp; <kbd>Alt</kbd>+<kbd>b</kbd> 

* **jump-and-select.jumpBackwardSelect**   &emsp; - &emsp; Selects from the cursor to the previous occurrence of the character.
&emsp; <kbd>Shift</kbd>+<kbd>b</kbd>

<br/>

These are default keybindings, you can change them like this in your `keybindings.json`:  

```jsonc
{
  "key": "alt+f",                  // <== change this to whatever you want
  "command": "jump-and-select.jumpForwardOnly"
  // "when": "editorTextFocus && editorLangId == javascript"  // for example
}
```

-------  

## Known Issues

This extension may not play well with vim or neovim or similar due to registering the same `'type'` command as those extensions do.  However, this extension disposes of that binding immediately after typing one character so it may not be an issue...

## TODO  
  
[ X ] - Explore a setting for setting cursor prior to or after typed character.
[&emsp; ] - Explore use of multi-character queries in macros or keybindings. 
[&emsp; ] - Explore use of args in keybindings (including macros).  
[&emsp; ] - Explore allowing input via 'paste' as well.     
[&emsp; ] - Add a setting to make searches case-insensitive.  
[&emsp; ] - Add handling of special regex characters `^` and `$` if they are not in the text.

## Release Notes  

* 0.0.1 &emsp;  Initial release of `jump-and-select` extension.  

* 0.0.2 &emsp;  Change behavior of go to previous character, put cursor before the character.

* 0.0.3 &emsp;  Added setting to restrict movement/selection to current line or full document.  
&emsp;&emsp; &emsp; Added setting to move/select before or after the chosen character.






-----------------------------------------------------------------------------------------------------------