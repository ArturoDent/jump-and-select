const { workspace } = require('vscode');
const EXTENSION_NAME = "jump-and-select";


/**
 *
 * 
 */
exports.getSettings = async function () {

  const config = workspace.getConfiguration(EXTENSION_NAME);
  const defaults = await config.get('defaults');

  // get the deprecated settings, to use only if no good settings
  const depRestrictSearch = await config.get('restrictSearch');
  const depPutCursorForward = await config.get('putCursorForward');
  const depPutCursorBackward = await config.get('putCursorBackward');

  // combine good defaults with deprecated defaults with generic defaults
  const restrictSearch = defaults.restrictSearch ?? depRestrictSearch ?? "document";  
  const putCursorOnForwardJump = defaults.putCursorOnForwardJump ?? depPutCursorForward ?? "beforeCharacter";
  const putCursorOnForwardSelect = defaults.putCursorOnForwardSelect ?? depPutCursorForward ?? "afterCharacter";
  const putCursorOnBackwardJump = defaults.putCursorOnBackwardJump ?? depPutCursorBackward ?? "beforeCharacter";
  const putCursorOnBackwardSelect = defaults.putCursorOnBackwardSelect ?? depPutCursorBackward ?? "beforeCharacter";
  
  return {
    restrictSearch,
    putCursorOnForwardJump,
    putCursorOnForwardSelect,
    putCursorOnBackwardJump,
    putCursorOnBackwardSelect
  };
}