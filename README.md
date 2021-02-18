# jump-and-select

Jump/move the cursor to the next or previous occurrence of some character.  
You can also select the text from the current cursor position to that next/previous character.

<br/>

-----------


## How It Works

Choose one of your keybindings, say <kbd>Alt</kbd>+<kbd>f</kbd> to jump forward.  

1.  Trigger that command: <kbd>Alt</kbd>+<kbd>f</kbd>,   
2.  Type a character (it will not be shown), and     
3.  Cursor moves to that next character.  

<img src="https://github.com/ArturoDent/jump-and-select/blob/master/images/jumpIntro.gif?raw=true" width="700" height="300" alt="Move cursors forward to next character"/>  


----------


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

[&emsp; ] - Add handling of special regex characters `^` and `$` if they are not in the text.  
[&emsp; ] - Explore a setting for setting cursor prior to or after typed character.

## Release Notes  

* 0.0.1 &emsp;  Initial release of `jump-and-select` extension





-----------------------------------------------------------------------------------------------------------