# Keybindings and macros

We have already seen simple keybindings like

```jsonc
{
  "key": "alt+f",           // default keybinding, can be changed
  "command": "jump-and-select.jumpForward",
     // "args" options not needed if you are happy with the defaults for the settings
},

{
  "key": "alt+g",           
  "command": "jump-and-select.jumpForward",
  "args": {                             // an example using "args"
    "text": "}",
    "putCursorForwardJump": "afterCharacter",
    "restrictSearch": "document"
  }
}
```

<img src="https://github.com/ArturoDent/jump-and-select/blob/main/images/keybindingCompletions.gif?raw=true" width="850" height="200" alt="Intellisense completion for keybindings"/>

## multiMode keybindings do not need to have a `text` argument

But non-multiMode commands do require a `text` argument as it makes no sense to trigger `jumpForward`, for example, with no argument.

```jsonc
{
  "key": "alt+f",           // default keybinding, can be changed
  "command": "jump-and-select.jumpForward",
   "args": {
    "text": "foo"   // the 'text' argument is required here, not one of the 'multiMode' commands
   }
},

// a multiMode command does not require a 'text' argument
// you can initiate a multiMode session first and then start to jump and select
{
  "key": "alt+g",
  "command": "jump-and-select.jumpForwardMultiMode",
  "args": {
    // "text": "}",   // the 'text' argument is NOT required here
    "putCursorForwardJump": "afterCharacter",
    "restrictSearch": "document"
  }
}
```

## Macros/Run Multiple Commands

Using the built-in command: `runCommands` you can chain together this extension's commands with each other or with other vscode/extension commands.  Example:

```jsonc
{
  "key": "alt+r",
  "command": "runCommands",
  "args": {
    "commands": [
      {
        "command": "jump-and-select.jumpBackward",
        "args": {
          "text": "{",
          "putCursorBackwardJump": "afterCharacter",
          "restrictSearch": "document"
        }
      },
      {
        "command": "jump-and-select.jumpForwardSelect",
        "args": {
          "text": "}",
          "putCursorForwardSelect": "beforeCharacter",
          "restrictSearch": "document"
        }
      },
    ]
  }
}
```

This macro would select all text between brackets `{...}` around the cursor.  

-------------
