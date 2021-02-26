const vscode = require('vscode');


/** @type { vscode.StatusBarItem } */
// let sbItem;
// let statusBarItemNotShowing = true;


/**
 * The Object returned containing the index of the matched query or -1
 *   and the index of the updated cursor location
 *
 * @typedef  {Object} QueryObject
 * @property {Number} queryIndex  - index of query character in line or document
 * @property {Number} cursorIndex - index/offset of cursor in document
 */

// -------------------------------------------------------------------------------------------

/**
 * Move cursor forward to next chosen character, without selection
 * @param {Boolean} restrict
 * @param {string} putCursorForward
 * @param {string} kbText - keybinding text, if any or empty string
 */
exports.jumpForward = function (restrict, putCursorForward, kbText) {

	if (kbText) {            // triggered via a keybinding
		_jumpForward(restrict, putCursorForward, kbText);
	}
	else {
		let typeDisposable = vscode.commands.registerCommand('type', arg => {
			// arg === { text: "a" }, so use arg.text to get the value

			// on 'Enter' exit command
			if (_shouldExitCommand(typeDisposable, arg.text)) return;

			_jumpForward(restrict, putCursorForward, arg.text);
			typeDisposable.dispose();
		});
	}
}

/**
 * Move cursor forward to next chosen character, with selection from cursor to character
 * @param {Boolean} restrict
 * @param {string} putCursorForward
 * @param {string} kbText - keybinding text, if any or empty string
 */
exports.jumpForwardSelect = function (restrict, putCursorForward, kbText) {

	if (kbText) {            // triggered via a keybinding
		_jumpForwardSelect(restrict, putCursorForward, kbText);
	}
	else {

		let typeDisposable = vscode.commands.registerCommand('type', arg => {

			// on 'Enter' exit command
			if (_shouldExitCommand(typeDisposable, arg.text)) return;

			_jumpForwardSelect(restrict, putCursorForward, arg.text);
			typeDisposable.dispose();
		});
	}
}


/**
 * Move cursor backward to previous chosen character, without selection
 * @param {Boolean} restrict
 * @param {string} putCursorBackward
 * @param {string} kbText - keybinding text, if any or empty string
 */
exports.jumpBackward = function (restrict, putCursorBackward, kbText) {

	if (kbText) {            // triggered via a keybinding
		_jumpBackward(restrict, putCursorBackward, kbText);
	}
	else {

		let typeDisposable = vscode.commands.registerCommand('type', arg => {

			// on 'Enter' exit command
			if (_shouldExitCommand(typeDisposable, arg.text)) return;

			_jumpBackward(restrict, putCursorBackward, arg.text);
			typeDisposable.dispose();
		});
	}
}


/**
 * Move cursor backward to previous chosen character, with selection from cursor to character
 * @param {Boolean} restrict
 * @param {string} putCursorBackward
 * @param {string} kbText - keybinding text, if any or empty string
 */
exports.jumpBackwardSelect = function (restrict, putCursorBackward, kbText) {

	if (kbText) {            // triggered via a keybinding
		_jumpBackwardSelect(restrict, putCursorBackward, kbText);
	}
	else {

		let typeDisposable = vscode.commands.registerCommand('type', arg => {

			// on 'Enter' exit command
			if (_shouldExitCommand(typeDisposable, arg.text)) return;

			_jumpBackwardSelect(restrict, putCursorBackward, arg.text);
			typeDisposable.dispose();
		});
	}
}


/**
 * Move cursor forward to next chosen character, without selection
 * @param {Boolean} restrict
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

		if (restrict) {
			queryObject = getQueryLineIndexForward(curPos, query);
		}
		else {
			queryObject = getQueryDocumentIndexForward(curPos, query);
		}

		if ((queryObject.cursorIndex !== -1) && (queryObject.queryIndex !== -1)) {

			let queryPos;  // query Position
			if (putCursorForward === "afterCharacter") {
				// use query.length instead of 1 for keybinding arg.text
				const finalCurPos = queryObject.queryIndex + queryObject.cursorIndex + query.length;
				// queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.cursorIndex + 1);
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
 * @param {Boolean} restrict
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

		let curPos = selection.active;
		let queryObject;

		if (restrict) {
			queryObject = getQueryLineIndexForward(curPos, query);
		}
		else {
			queryObject = getQueryDocumentIndexForward(curPos, query);
		}

		// if there is no next selection, should we lose the last selection?
		if ((queryObject.cursorIndex !== -1) && (queryObject.queryIndex !== -1)) {

			let queryPos;
			if (putCursorForward === "afterCharacter") {
				const finalCurPos = queryObject.queryIndex + queryObject.cursorIndex + query.length;

				// queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.cursorIndex + 1);
				queryPos = editor.document.positionAt(finalCurPos);
			}
			else queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.cursorIndex);

			selections[index] = new vscode.Selection(curPos, queryPos);
			editor.selections = selections;
		}
	});
}


/**
 * Move cursor backward to next chosen character, without selection
 * @param {Boolean} restrict
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

		if (restrict) {
			queryObject = getQueryLineIndexBackward(curPos, query);
		}
		else {
			queryObject = getQueryDocumentIndexBackward(curPos, query);
		}

		if ((queryObject.cursorIndex !== -1) && (queryObject.queryIndex !== -1)) {

			let queryPos;

			if (putCursorBackward === "afterCharacter") {
				// const finalCurPos = queryObject.queryIndex + queryObject.cursorIndex + query.length;
				// if (restrict) queryPos = new vscode.Position(curPos.line, queryObject.queryIndex + 1);
				if (restrict) queryPos = new vscode.Position(curPos.line, queryObject.queryIndex + query.length);
				// else queryPos = editor.document.positionAt(queryObject.queryIndex + 1);
				else queryPos = editor.document.positionAt(queryObject.queryIndex + query.length);
			}
			else {   // (putCursorBackward === "afterCharacter") effective default

				// const finalCurPos = queryObject.queryIndex + queryObject.cursorIndex;
				if (restrict) queryPos = new vscode.Position(curPos.line, queryObject.queryIndex);
				// else queryPos = editor.document.positionAt(queryObject.queryIndex);
				else queryPos = editor.document.positionAt(queryObject.queryIndex);
				// else queryPos = editor.document.positionAt(finalCurPos);
			}

			selections[index] = new vscode.Selection(queryPos, queryPos);
			editor.selections = selections;
		}
	});
}

/**
 * Move cursor backward to previous chosen character, with selection from cursor to character
 * @param {Boolean} restrict
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

		let curPos = selection.active;
		let queryObject;

		if (restrict) {
			queryObject = getQueryLineIndexBackward(curPos, query);
		}
		else {
			queryObject = getQueryDocumentIndexBackward(curPos, query);
		}

		if ((queryObject.cursorIndex !== -1) && (queryObject.queryIndex !== -1)) {

			let queryPos;

			if (putCursorBackward === "afterCharacter") {
				if (restrict) queryPos = new vscode.Position(curPos.line, queryObject.queryIndex + query.length);
				else queryPos = editor.document.positionAt(queryObject.queryIndex + query.length);
			}
			else {
				if (restrict) queryPos = new vscode.Position(curPos.line, queryObject.queryIndex);
				else queryPos = editor.document.positionAt(queryObject.queryIndex);
			}

			selections[index] = new vscode.Selection(curPos, queryPos);
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
	let cursorIndex = vscode.window.activeTextEditor?.document.offsetAt(cursorPosition) || -1;
	const editor = vscode.window.activeTextEditor;

	if (editor) {

		let restOfLine = editor.document.lineAt(cursorPosition.line).text.substring(cursorPosition.character);

		const regexp = new RegExp(query, 'g');
		const matches = [...restOfLine.matchAll(regexp)];
		if (matches.length) queryIndex = Number(matches[0].index);

		if (queryIndex === 0) {
			if (matches.length > 1) {
				queryIndex = Number(matches[1].index) - 1;
				cursorPosition = new vscode.Position(cursorPosition.line, cursorPosition.character + 1);
				cursorIndex = editor.document.offsetAt(cursorPosition);
			}
		}
	}
	return {
		queryIndex: queryIndex,
		cursorIndex: cursorIndex
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
	let cursorIndex = vscode.window.activeTextEditor?.document.offsetAt(cursorPosition) || -1;
	const editor = vscode.window.activeTextEditor;

	if (editor) {

		let lastLine = editor.document.lineAt(editor.document.lineCount - 1);
		let curEndRange = new vscode.Range(cursorPosition, lastLine.range.end);

		const regexp = new RegExp(query, 'g');
		const matches = [...editor.document.getText(curEndRange).matchAll(regexp)];
		if (matches.length) queryIndex = Number(matches[0].index);

		if (queryIndex === 0) {
			if (matches.length > 1) {
				queryIndex = Number(matches[1].index) - 1;
				cursorPosition = new vscode.Position(cursorPosition.line, cursorPosition.character + 1);
				cursorIndex = editor.document.offsetAt(cursorPosition);
			}
		}
	}
	return  {
		queryIndex: queryIndex,
		cursorIndex: cursorIndex
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
	let cursorIndex = vscode.window.activeTextEditor?.document.offsetAt(cursorPosition) || -1;
	const editor = vscode.window.activeTextEditor;

	if (editor) {

		let startOfLine = editor.document.lineAt(cursorPosition.line).text.substring(0, cursorPosition.character);

		const regexp = new RegExp(query, 'g');
		const matches = [...startOfLine.matchAll(regexp)];
		if (matches.length)
			queryIndex = Number(matches[matches.length - 1].index);
	}
	return {
		queryIndex: queryIndex,
		cursorIndex: cursorIndex
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
	let cursorIndex = vscode.window.activeTextEditor?.document.offsetAt(cursorPosition) || -1;
	const editor = vscode.window.activeTextEditor;

	if (editor) {

		const firstLine = editor.document.lineAt(0);
		let curStartRange = new vscode.Range(cursorPosition, firstLine.range.start);

		const regexp = new RegExp(query, 'g');
		const matches = [...editor.document.getText(curStartRange).matchAll(regexp)];
		if (matches.length)
			queryIndex = Number(matches[matches.length - 1].index);
	}

	return  {
		queryIndex: queryIndex,
		cursorIndex: cursorIndex
	}
}

/**
 * Should the command be exited, has a Return been typed?
 * @param {vscode.Disposable} typeDisposable
 * @param {string} arg
 */
function _shouldExitCommand(typeDisposable, arg) {

		// on 'Enter' exit command
	if (arg === '\n') {
		// sbItem.dispose();
		// statusBarItemNotShowing = true;
		typeDisposable.dispose();
		return true;
	}
	return false;
}