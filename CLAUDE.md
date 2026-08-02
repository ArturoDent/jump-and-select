# Instructions for using skills/run-extension-host

## Enable using local keybindings in the Extension Host

True single-command scoping only exists in Bash/Git Bash (POSIX sh), via the "prefix" form - a bare VAR=value immediately before the command, no export, no semicolon:

`EXT_HOST_INHERIT_KEYBINDINGS=1 node C:/Users/markm/.claude/skills/run-extension-host/driver.mjs`

This sets the variable only in the environment of that one child process. The shell you're typing into never has it set at all - nothing to clean up afterward. This is the pattern I actually used for all of this session's test runs (e.g. `EXT_HOST_KEYBINDINGS_PATH="..." node driver.mjs`).

PowerShell has no equivalent one-line scoped form. $env:X = "value" is always a persistent assignment to the current session. To approximate "just this command" in PowerShell, you have to do it in three explicit steps:

`$env:EXT_HOST_INHERIT_KEYBINDINGS = "1"`
`node C:\Users\markm\.claude\skills\run-extension-host\driver.mjs`
`Remove-Item Env:\EXT_HOST_INHERIT_KEYBINDINGS`

Or just accept that it stays set for the rest of that PowerShell window and remove it (or close the window) when you're done testing overrides.

This only affects that one command in PowerShell 5.1 syntax (semicolon-chained, not &&).

## Disable using local keybindings in the Extension Host

If you set it in an interactive terminal session (so it persists across multiple commands), turn it off with:

`Remove-Item Env:\EXT_HOST_INHERIT_KEYBINDINGS -ErrorAction SilentlyContinue`

`=0` now works too (I just fixed that), but unsetting is the more foolproof habit.

## Verifying command/keybinding behavior changes

After changing the behavior of a command or keybinding, ask the user first if you should run the `run-extension-host` skill if it seems applicable to you.  If the user authorizes its use, verify the changes actually work using the `run-extension-host` skill (personal skill, available in every project) - launch a real Extension Development Host, trigger the keybinding, and check the result (selection via `clipboard`, or a file diff for text-rewriting commands) rather than relying on unit tests alone for a behavioral change.

<!-- DISABLED: uncomment to stop auto-verifying this way -->
