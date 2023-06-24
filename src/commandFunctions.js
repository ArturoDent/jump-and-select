const vscode = require('vscode');

/** @type { vscode.StatusBarItem } */
let sbItem;
let statusBarItemShowing = false;

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
 * @param {string} putCursorForward - move cursor before/after character typed
 * @param {string} kbText - keybinding text, if any or empty string
 * @param {boolean} multiMode - in MultiMode?
 */
exports.jumpForward = function (restrict, putCursorForward, kbText, multiMode) {

	if (kbText) {            						// triggered via a keybinding
		_jumpForward(restrict, putCursorForward, kbText);
	}
	else {
		let typeDisposable = vscode.commands.registerCommand('type', arg => {
			// arg === { text: "a" }, so use arg.text to get the value

			// on 'Enter' exit command and dispose
			if (_shouldExitAndDisposeCommand(typeDisposable, arg.text)) return;

			_jumpForward(restrict, putCursorForward, arg.text);
			if (!multiMode) typeDisposable.dispose();
			if (multiMode && !statusBarItemShowing) _showStatusBarItem();
		});
	}
}


/**
 * Move cursor forward to next chosen character, with selection from cursor to character
 * @param {string} restrict - search forward in current line or document
 * @param {string} putCursorForward - select forward to before/after character typed
 * @param {string} kbText - keybinding text, if any or empty string
 * @param {boolean} multiMode - in MultiMode?
 */
exports.jumpForwardSelect = function (restrict, putCursorForward, kbText, multiMode) {

	if (kbText) {
		_jumpForwardSelect(restrict, putCursorForward, kbText);
	}
	else {

		let typeDisposable = vscode.commands.registerCommand('type', arg => {

			if (_shouldExitAndDisposeCommand(typeDisposable, arg.text)) return;

			_jumpForwardSelect(restrict, putCursorForward, arg.text);
			if (!multiMode) typeDisposable.dispose();
			if (multiMode && !statusBarItemShowing) _showStatusBarItem();
		});
	}
}


/**
 * Move cursor backward to previous chosen character, without selection
 * @param {string} restrict - search backward in current line or document
 * @param {string} putCursorBackward - move cursor before/after character typed
 * @param {string} kbText - keybinding text, if any or empty string
 * @param {boolean} multiMode - in MultiMode?
 */
exports.jumpBackward = function (restrict, putCursorBackward, kbText, multiMode) {

	if (kbText) {
		_jumpBackward(restrict, putCursorBackward, kbText);
	}
	else {

		let typeDisposable = vscode.commands.registerCommand('type', arg => {

			if (_shouldExitAndDisposeCommand(typeDisposable, arg.text)) return;

			_jumpBackward(restrict, putCursorBackward, arg.text);
			if (!multiMode) typeDisposable.dispose();
			if (multiMode && !statusBarItemShowing) _showStatusBarItem();
		});
	}
}


/**
 * Move cursor backward to previous chosen character, with selection from cursor to character
 * @param {string} restrict - search backward in current line or document
 * @param {string} putCursorBackward - select backward to before/after character typed
 * @param {string} kbText - keybinding text, if any or empty string
 * @param {boolean} multiMode - in MultiMode?
 */
exports.jumpBackwardSelect = function (restrict, putCursorBackward, kbText, multiMode) {

	if (kbText) {
		_jumpBackwardSelect(restrict, putCursorBackward, kbText);
	}
	else {

		let typeDisposable = vscode.commands.registerCommand('type', arg => {

			if (_shouldExitAndDisposeCommand(typeDisposable, arg.text)) return;

			_jumpBackwardSelect(restrict, putCursorBackward, arg.text);
			if (!multiMode) typeDisposable.dispose();
			if (multiMode && !statusBarItemShowing) _showStatusBarItem();
		});
	}
}


/**
 * Move cursor forward to next chosen character, without selection
 * @param {string} restrict
 * @param {string} putCursorForward
 * @param {string} query - keybinding arg or next character typed
 */
function _jumpForward(restrict, putCursorForward, query) {

	if (!vscode.window.activeTextEditor) {
		return;
	}
	const editor = vscode.window.activeTextEditor;
	const selections = editor.selections;

	selections.forEach((selection, index) => {

		let curPos = selection.active;  // cursor Position
		let queryObject;

		if (restrict === "line") {
			queryObject = getQueryLineIndexForward(curPos, query);
		}
		else {
			queryObject = getQueryDocumentIndexForward(curPos, query);
		}

		if ((queryObject.cursorIndex !== -1) && (queryObject.queryIndex !== -1)) {

			let queryPos;  // query Position
			if (putCursorForward === "afterCharacter") {
				const finalCurPos = queryObject.queryIndex + queryObject.cursorIndex + queryObject.matchLength;
				queryPos = editor.document.positionAt(finalCurPos);
			}
			else queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.cursorIndex);  // effective default

			selections[index] = new vscode.Selection(queryPos, queryPos);
			editor.selections = selections;
		}
	});
}


/**
 * Move cursor forward to next chosen character, with selection from cursor to character
 * @param {string} restrict
 * @param {string} putCursorForward
 * @param {string} query - keybinding arg or next character typed
 */
function _jumpForwardSelect (restrict, putCursorForward, query) {

	if (!vscode.window.activeTextEditor) {
		return;
	}
	const editor = vscode.window.activeTextEditor;
	const selections = editor.selections;

	selections.forEach((selection, index) => {
    const curAnchor = selection.anchor;
		let curPos = selection.active;
		let queryObject;

		if (restrict === "line") {
			queryObject = getQueryLineIndexForward(curPos, query);
		}
		else {
			queryObject = getQueryDocumentIndexForward(curPos, query);
		}

		// if there is no next selection, should we lose the last selection?
		if ((queryObject.cursorIndex !== -1) && (queryObject.queryIndex !== -1)) {

			let queryPos;
			if (putCursorForward === "afterCharacter") {
				const finalCurPos = queryObject.queryIndex + queryObject.cursorIndex + queryObject.matchLength;
				queryPos = editor.document.positionAt(finalCurPos);
			}
			else queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.cursorIndex);

			selections[index] = new vscode.Selection(curAnchor, queryPos);
			editor.selections = selections;
		}
	});
}


/**
 * Move cursor backward to next chosen character, without selection
 * @param {string} restrict
 * @param {string} putCursorBackward
 * @param {string} query - keybinding arg or next character typed
 */
function _jumpBackward(restrict, putCursorBackward, query) {

	if (!vscode.window.activeTextEditor) {
		return;
	}
	const editor = vscode.window.activeTextEditor;
	const selections = editor.selections;

	selections.forEach((selection, index) => {

		let curPos = selection.active;
		let queryObject;

		if (restrict === "line") {
			queryObject = getQueryLineIndexBackward(curPos, query);
		}
		else {
			queryObject = getQueryDocumentIndexBackward(curPos, query);
		}

		if ((queryObject.cursorIndex !== -1) && (queryObject.queryIndex !== -1)) {

			let queryPos;

			if (putCursorBackward === "afterCharacter") {
				if (restrict === "line") queryPos = new vscode.Position(curPos.line, queryObject.queryIndex + queryObject.matchLength);
				else queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.matchLength);
			}
			else {   // (putCursorBackward === "afterCharacter") effective default
				if (restrict === "line") queryPos = new vscode.Position(curPos.line, queryObject.queryIndex);
				else queryPos = editor.document.positionAt(queryObject.queryIndex);
			}

			selections[index] = new vscode.Selection(queryPos, queryPos);
			editor.selections = selections;
		}
	});
}


/**
 * Move cursor backward to previous chosen character, with selection from cursor to character
 * @param {string} restrict
 * @param {string} putCursorBackward
 * @param {string} query - keybinding arg or next character typed
 */
function _jumpBackwardSelect(restrict, putCursorBackward, query) {

	if (!vscode.window.activeTextEditor) {
		return;
	}

	const editor = vscode.window.activeTextEditor;
	const selections = editor.selections;

	selections.forEach((selection, index) => {
    const curAnchor = selection.anchor;
		let curPos = selection.active;
		let queryObject;

		if (restrict === "line") {
			queryObject = getQueryLineIndexBackward(curPos, query);
		}
		else {
			queryObject = getQueryDocumentIndexBackward(curPos, query);
		}

		if ((queryObject.cursorIndex !== -1) && (queryObject.queryIndex !== -1)) {

			let queryPos;

			if (putCursorBackward === "afterCharacter") {
				if (restrict === "line") queryPos = new vscode.Position(curPos.line, queryObject.queryIndex + queryObject.matchLength);
				else queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.matchLength);
			}
			else {
				if (restrict === "line") queryPos = new vscode.Position(curPos.line, queryObject.queryIndex);
				else queryPos = editor.document.positionAt(queryObject.queryIndex);
			}

			selections[index] = new vscode.Selection(curAnchor, queryPos);
			editor.selections = selections;
		}
	});
}


/**
 *  Get the next query position restricted to the line of the cursor
 * @param {vscode.Position} cursorPosition
 * @param {string} query - the typed character to match
 * @returns {QueryObject}
 */
function getQueryLineIndexForward(cursorPosition, query) {

	let queryIndex = -1;
	const editor = vscode.window.activeTextEditor;
	let cursorIndex = editor?.document.offsetAt(cursorPosition) || -1;
	let matchLength = 0;

	if (editor) {

		let restOfLine = editor.document.lineAt(cursorPosition.line).text.substring(cursorPosition.character);

		const regexp = new RegExp(query, 'gm');
		const matches = [...restOfLine.matchAll(regexp)];
		if (matches.length) {
			queryIndex = Number(matches[0].index);
			matchLength = matches[0][0].length;
		}

		if (queryIndex === 0) {
			if (matches.length > 1) {
				queryIndex = Number(matches[1].index) - 1;
				cursorPosition = new vscode.Position(cursorPosition.line, cursorPosition.character + 1);
				cursorIndex = editor.document.offsetAt(cursorPosition);
				matchLength = matches[1][0].length;
			}
		}
	}
	return {
		queryIndex: queryIndex,
		cursorIndex: cursorIndex,
		matchLength: matchLength
	}
}


/**
 * Get the next query position anywhere in the document after the cursor
 * @param {vscode.Position} cursorPosition
 * @param {string} query - the typed character to match
 * @returns {QueryObject}
 */
function getQueryDocumentIndexForward(cursorPosition, query) {

	let queryIndex = -1;
	const editor = vscode.window.activeTextEditor;
	let cursorIndex = editor?.document.offsetAt(cursorPosition) || -1;
	let matchLength = 0;

	if (editor) {

		let lastLine = editor.document.lineAt(editor.document.lineCount - 1);
		let curEndRange = new vscode.Range(cursorPosition, lastLine.range.end);

		const regexp = new RegExp(query, 'gm');
		const matches = [...editor.document.getText(curEndRange).matchAll(regexp)];
		if (matches.length) {
			queryIndex = Number(matches[0].index);
			matchLength = matches[0][0].length;
		}

		if (queryIndex === 0) {
			if (matches.length > 1) {
				queryIndex = Number(matches[1].index) - 1;
				cursorPosition = new vscode.Position(cursorPosition.line, cursorPosition.character + 1);
				cursorIndex = editor.document.offsetAt(cursorPosition);
				matchLength = matches[1][0].length;
			}
		}
	}
	return  {
		queryIndex: queryIndex,
		cursorIndex: cursorIndex,
		matchLength: matchLength
	}
}


/**
 * Get the previous query position restricted to the line of the cursor
 * @param {vscode.Position} cursorPosition
 * @param {string} query - the typed character to match
 * @returns {QueryObject}
 */
function getQueryLineIndexBackward(cursorPosition, query) {

	let queryIndex = -1;
	const editor = vscode.window.activeTextEditor;
	let cursorIndex = editor?.document.offsetAt(cursorPosition) || -1;
	let matchLength = 0;

	if (editor) {

		let startOfLine = editor.document.lineAt(cursorPosition.line).text.substring(0, cursorPosition.character);

		const regexp = new RegExp(query, 'gm');
		const matches = [...startOfLine.matchAll(regexp)];

		// if going backward and cursor right after search query position, skip and goto next
		if ((matches.length > 1) && (cursorPosition.character === (Number(matches[matches.length - 1].index) + 1))) {
			queryIndex = Number(matches[matches.length - 2].index);
			matchLength = matches[matches.length - 2][0].length;
		}
		else if (matches.length) {
			queryIndex = Number(matches[matches.length - 1].index);
			matchLength = matches[matches.length - 1][0].length;
		}
	}
	return {
		queryIndex: queryIndex,
		cursorIndex: cursorIndex,
		matchLength: matchLength
	}
}


/**
 * Get the previous query position anywhere in the document prior to cursor
 * @param {vscode.Position} cursorPosition
 * @param {string} query - the typed character to match
 * @returns {QueryObject}
 */
function getQueryDocumentIndexBackward(cursorPosition, query) {

	let queryIndex = -1;
	const editor = vscode.window.activeTextEditor;
	let cursorIndex = editor?.document.offsetAt(cursorPosition) || -1;
	let matchLength = 0;

	if (editor) {

		const firstLine = editor.document.lineAt(0);
		let curStartRange = new vscode.Range(cursorPosition, firstLine.range.start);

		const regexp = new RegExp(query, 'gm');
		const matches = [...editor.document.getText(curStartRange).matchAll(regexp)];

		// if going backward and cursor right after search query position, skip and goto next
		if ((matches.length > 1) && (cursorIndex === (Number(matches[matches.length - 1].index) + 1))) {
			queryIndex = Number(matches[matches.length - 2].index);
			matchLength = matches[matches.length - 2][0].length;
		}
		else if (matches.length) {
			queryIndex = Number(matches[matches.length - 1].index);
			matchLength = matches[matches.length - 1][0].length;
		}
	}

	return  {
		queryIndex: queryIndex,
		cursorIndex: cursorIndex,
		matchLength: matchLength
	}
}

// ------------------------------------------------------------------------------------------------

/**
 * Should the command be exited, has a Return been typed after command started?
 * If so, dispose of the 'type' command binding and statusBarItem
 *
 * @param {vscode.Disposable} typeDisposable
 * @param {string} arg - character typed after command initiated
 * @returns { boolean } - 'Return' has been typed
 */
function _shouldExitAndDisposeCommand(typeDisposable, arg) {

	if (arg === '\n') {
		sbItem.dispose();
		statusBarItemShowing = false;
		typeDisposable.dispose();
		return true;
	}
	return false;
}

// ------------------------------------------------------------------------------------------------

/**
 * Create and show a StatusBarItem
 * advising to press 'Return' to exit multiMode
 */
function _showStatusBarItem() {

	sbItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
	sbItem.text = "Press 'Return' to exit jump";
	sbItem.tooltip = "'Return' will exit the current jump command";
	sbItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
	sbItem.show();
	statusBarItemShowing = true;
}