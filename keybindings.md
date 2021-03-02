## Keybindings and macros

We have already seen simple keybindings like

```jsonc
{
	"key": "alt+f",          						// default keybinding, can be changed
	"command": "jump-and-select.jumpForward",
		// "args" options not needed if you are happy with the defaults for the settings
},

{
	"key": "alt+g",           
	"command": "jump-and-select.jumpForward",
	"args": {                         				// an example using "args"
		"text": "}",                    			// can be a regexp or simple text
		"putCursorforward": "afterCharacter",
		"restrictSearch": "document"
	}
}
```

If you use the `"args"`, put it right after the `"command"` as shown above to get intellisense/completion for both the `"args"` keys, like `"putCursorForward"` and their possible values, like `"afterCharacter"`.  The commands `jumpForward` and `jumpForwardSelect` have different possible `args` than do the commands `jumpBackward` and `jumpBackwardSelect`.  

<img src="https://github.com/ArturoDent/jump-and-select/blob/master/images/keybindingCompletions.gif?raw=true" width="850" height="200" alt="Intellisense completion for keybindings"/>

Note: If you use the characters `^` or `$` in the `"text"` value they will interpreted as regex start/end of line.  If you want them to be interpreted literally, use them like this:

```jsonc
"args": {                         				
	"text": "\\$",              // double-escaped to be treated literally
}
```

### Macros

Using a macro extension like [multi-command](https://marketplace.visualstudio.com/items?itemName=ryuta46.multi-command) you can chain together this extension's commands with each other or with other vscode/extension commands.  Example:

```jsonc
{
	"key": "alt+r",
	"command": "extension.multiCommand.execute",
	"args": {
	  "sequence": [
		  {
			  "command": "jump-and-select.jumpBackward",
			  "args": {
				  "text": "{\\s*",
				  "putCursorBackward": "afterCharacter",
				  "restrictSearch": "document"
			  }
		  },
		  {
			  "command": "jump-and-select.jumpForwardSelect",
			  "args": {
				  "text": "\\s*}",
				  "putCursorForward": "beforeCharacter",
				  "restrictSearch": "document"
			  }
		  },
  	]
	},
}
```

This macro would select all text between brackets `{...}` around the cursor.    

<img src="https://github.com/ArturoDent/jump-and-select/blob/master/images/macroSelectBrackets.gif?raw=true" width="900" height="200" alt="selecting between brackets macro demo"/> 
  
<br/><br/>

It could be interesting to insert and then modify a snippet using this extension to move the cursor and select text.  

<br/><br/>

-------------