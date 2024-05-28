const vscode = require('vscode');
const statusBarItem = require('./statusBar');

var global = Function('return this')();  // used for global.typeDisposable

/**
 * The Object returned contains the index of the matched query or -1,
 *   the index of the updated cursor location and the length of the match
 *
 * @typedef  {Object} QueryObject
 * @property {Number} queryIndex  - index of query character in line or document
 * @property {Number} cursorIndex - index/offset of cursor in document
 * @property {Number} matchLength - the length of the match, esp. useful for regexp's
 */

// -------------------------------------------------------------------------------------------


/**
 * Move cursor forward to next chosen character, without selection
 * @param {string} restrict - search forward in current line or document
 * @param {string} putCursor - move cursor before/after character typed
 * @param {string} kbText - keybinding text, if any or empty string
 * @param {boolean} multiMode - in MultiMode?
 * @param {boolean} select - in select?
 */
exports.jumpForward = async function (restrict, putCursor, kbText, multiMode, select) {

  if (multiMode && !global.statusBarItemVisible) await statusBarItem.show();

  // if kbText = triggered via a keybinding
  // if (kbText && select) _jumpForwardSelect(restrict, putCursor, kbText);
  // else if (kbText) _jumpForward(restrict, putCursor, kbText, select);
  if (kbText) _jumpForward(restrict, putCursor, kbText, select);
  
  else {
    
    global.typeDisposable = vscode.commands.registerCommand('type', async arg => {

      if (arg.text === '\n') {
        await statusBarItem.hide();
        await global.typeDisposable.dispose();
        return;
      }

      _jumpForward(restrict, putCursor, arg.text, select);
    
      if (!multiMode) await global.typeDisposable.dispose();
    });
  }
}


/**
 * Move cursor backward to previous chosen character, without selection
 * @param {string} restrict - search backward in current line or document
 * @param {string} putCursor - move cursor before/after character typed
 * @param {string} kbText - keybinding text, if any or empty string
 * @param {boolean} multiMode - in MultiMode?
 * @param {boolean} select - in select?
 */
exports.jumpBackward = async function (restrict, putCursor, kbText, multiMode, select) {

  if (multiMode && !global.statusBarItemVisible) await statusBarItem.show();
  
  if (kbText) _jumpBackward(restrict, putCursor, kbText, select);
  
  else {
  
    global.typeDisposable = vscode.commands.registerCommand('type', async arg => {

      if (arg.text === '\n') {
        await statusBarItem.hide();
        await global.typeDisposable.dispose();
        return;
      }

      _jumpBackward(restrict, putCursor, arg.text, select);
    
      if (!multiMode) await global.typeDisposable.dispose();
    });
  }
}


/**
 * Move cursor forward to next chosen character, without selection, and reveal if necessary
 * @param {string} restrict
 * @param {string} putCursorForward
 * @param {string} query - keybinding arg or next character typed
 * @param {boolean} select
 */
function _jumpForward(restrict, putCursorForward, query, select) {

	if (!vscode.window.activeTextEditor) {
		return;
	}
	const editor = vscode.window.activeTextEditor;
	const selections = editor.selections;

	selections.forEach((selection, index) => {

		let curPos = selection.active;  // cursor Position
		let queryObject;

		if (restrict === "line") {
			queryObject = getQueryLineIndexForward(curPos, query, putCursorForward);
		}
		else {
			queryObject = getQueryDocumentIndexForward(curPos, query, putCursorForward);
		}

		if ((queryObject.cursorIndex !== -1)  &&  (queryObject.queryIndex !== -1)) {

			let queryPos;  // query Position
			if (putCursorForward === "afterCharacter") {
				const finalCurPos = queryObject.queryIndex + queryObject.cursorIndex + queryObject.matchLength;
				queryPos = editor.document.positionAt(finalCurPos);
			}
			else queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.cursorIndex);  // effective default

      if (select) selections[index] = new vscode.Selection(curPos, queryPos);
      else selections[index] = new vscode.Selection(queryPos, queryPos);
      
      editor.selections = selections;
		}
  });
  // editor.revealRange(new vscode.Range(selections[0].anchor, selections[0].active), vscode.TextEditorRevealType.InCenterIfOutsideViewport);     // InCenterIfOutsideViewport = 2
  editor.revealRange(new vscode.Range(selections[0].anchor, selections[0].active), vscode.TextEditorRevealType.Default);  // Default = 0, as little scrolling as necessary
}


/**
 * Move cursor backward to next chosen character, without selection
 * @param {string} restrict
 * @param {string} putCursorBackward
 * @param {string} query - keybinding arg or next character typed
 * @param {boolean} select 
 */
function _jumpBackward(restrict, putCursorBackward, query, select) {

	if (!vscode.window.activeTextEditor) {
		return;
	}
	const editor = vscode.window.activeTextEditor;
	const selections = editor.selections;

	selections.forEach((selection, index) => {

		let curPos = selection.active;
		let queryObject;

		if (restrict === "line") {
			queryObject = getQueryLineIndexBackward(curPos, query, putCursorBackward);
		}
		else {
			queryObject = getQueryDocumentIndexBackward(curPos, query, putCursorBackward);
		}

		if ((queryObject.cursorIndex !== -1)  &&  (queryObject.queryIndex !== -1)) {

			let queryPos;

			if (putCursorBackward === "afterCharacter") {
				if (restrict === "line") queryPos = new vscode.Position(curPos.line, queryObject.queryIndex + queryObject.matchLength);
				else queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.matchLength);
			}
			else {   // (putCursorBackward === "afterCharacter") effective default
				if (restrict === "line") queryPos = new vscode.Position(curPos.line, queryObject.queryIndex);
				else queryPos = editor.document.positionAt(queryObject.queryIndex);
			}

      if (select) selections[index] = new vscode.Selection(curPos, queryPos);
      else selections[index] = new vscode.Selection(queryPos, queryPos);
      
			editor.selections = selections;
		}
  });
  // editor.revealRange(new vscode.Range(selections[0].anchor, selections[0].active), vscode.TextEditorRevealType.InCenterIfOutsideViewport);     // InCenterIfOutsideViewport = 2
  editor.revealRange(new vscode.Range(selections[0].anchor, selections[0].active), vscode.TextEditorRevealType.Default);  // Default = 0, as little scrolling as necessary
}


/**
 *  Get the next query position restricted to the line of the cursor
 * @param {vscode.Position} cursorPosition
 * @param {string} query - the typed character to match
 * @param {string} putCursorForward - before/afterCharacter
 * @returns {QueryObject}
 */
function getQueryLineIndexForward(cursorPosition, query, putCursorForward) {

	let queryIndex = -1;
	const editor = vscode.window.activeTextEditor;
	let cursorIndex = editor?.document.offsetAt(cursorPosition)  ||  -1;
	let matchLength = 0;

	if (editor) {

		let restOfLine = editor.document.lineAt(cursorPosition.line).text.substring(cursorPosition.character);
    let matchPos;
    
    if (putCursorForward === 'beforeCharacter') {
      matchPos = restOfLine.substring(query.length).indexOf(query);  // if no match
      if (matchPos !== -1) matchPos += query.length;
    }
    else matchPos = restOfLine.indexOf(query);
    
		if (matchPos !== -1) {
      queryIndex = matchPos;
			matchLength = query.length;
		}
	}
	return {
		queryIndex,
		cursorIndex,
		matchLength
	}
}


/**
 * Get the next query position anywhere in the document after the cursor
 * @param {vscode.Position} cursorPosition
 * @param {string} query - the typed character to match
 * @param {string} putCursorForward 
 * @returns {QueryObject}
 */
function getQueryDocumentIndexForward(cursorPosition, query, putCursorForward) {

	let queryIndex = -1;
	const editor = vscode.window.activeTextEditor;  // TODO: exclude schemes like vscode-data, etc.
	let cursorIndex = editor?.document.offsetAt(cursorPosition)  ||  -1;
	let matchLength = 0;

	if (editor) {

		let lastLine = editor.document.lineAt(editor.document.lineCount - 1);
		let curEndRange = new vscode.Range(cursorPosition, lastLine.range.end);  // to end of file
    
    const restOfText = editor.document.getText(curEndRange);
    
    let matchPos;
    
    if (putCursorForward === 'beforeCharacter') matchPos = restOfText.substring(query.length).indexOf(query) + query.length;
    else matchPos = restOfText.indexOf(query);
    
		if (matchPos !== -1) {
      queryIndex = matchPos;
			matchLength = query.length;
		}
	}
	return  {
		queryIndex,
		cursorIndex,
		matchLength
	}
}


/**
 * Get the previous query position restricted to the line of the cursor
 * @param {vscode.Position} cursorPosition
 * @param {string} query - the typed character to match
 * @param {string} purCursorBackward - before/afterCharacter
 * @returns {QueryObject}
 */
function getQueryLineIndexBackward(cursorPosition, query, purCursorBackward) {

	let queryIndex = -1;
	const editor = vscode.window.activeTextEditor;
	let cursorIndex = editor?.document.offsetAt(cursorPosition)  ||  -1;
	let matchLength = 0;

	if (editor) {

		let startOfLine = editor.document.lineAt(cursorPosition.line).text.substring(0, cursorPosition.character);

    let matchPos;
    
    if (purCursorBackward === 'afterCharacter') {
      const end = startOfLine.length - query.length;
      matchPos = startOfLine.substring(0, end).lastIndexOf(query);
    }
    else matchPos = startOfLine.lastIndexOf(query);  // is case-sensitive
    
		if (matchPos !== -1) {
      queryIndex = matchPos;
			matchLength = query.length;
		}
	}
	return {
		queryIndex,
		cursorIndex,
		matchLength
	}
}


/**
 * Get the previous query position anywhere in the document prior to cursor
 * @param {vscode.Position} cursorPosition
 * @param {string} query - the typed character to match
 * @param {string} purCursorBackward - before/afterCharacter
 * @returns {QueryObject}
 */
function getQueryDocumentIndexBackward(cursorPosition, query, purCursorBackward) {

	let queryIndex = -1;
	const editor = vscode.window.activeTextEditor;
	let cursorIndex = editor?.document.offsetAt(cursorPosition)  ||  -1;
	let matchLength = 0;

	if (editor) {

		const firstLine = editor.document.lineAt(0);
		let curStartRange = new vscode.Range(cursorPosition, firstLine.range.start);

    const startText = editor.document.getText(curStartRange);
    let matchPos;
    
    if (purCursorBackward === 'afterCharacter') {
      const end = startText.length - query.length;
      matchPos = startText.substring(0, end).lastIndexOf(query);
    }
    else matchPos = startText.lastIndexOf(query);  // is case-sensitive
    
		if (matchPos) {
      queryIndex = matchPos;
			matchLength = query.length;
		}
	}

	return  {
		queryIndex,
		cursorIndex,
		matchLength
	}
}