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


/**
 * Move cursor forward to next chosen character, without selection
 * @param {Boolean} restrict
 * @param {string} putCursorForward
 * @param {string} kbARG - keybinding arg, if any
 */
exports.jumpForward = function (restrict, putCursorForward, kbARG) {

	// arg === { text: "a" }, so use arg.text to get the value

	// let typeDisposable7 = vscode.commands.registerCommand('paste', arg => {
	// 	console.log(arg);   // works, and can do 'type' as well
	// });

	// console.log(kbARG);
	// if a kbARG, must separately call the workings of below

	let typeDisposable = vscode.commands.registerCommand('type', arg => {

		// don't show the statusBarItem if command from keybinding

		// if (statusBarItemNotShowing) {
		// 	sbItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
		// 	sbItem.text = "'Return' to exit jump";
		// 	sbItem.tooltip = "Pressing 'Return' will exit the current jump command";
		// 	sbItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
		// 	sbItem.show();
		// 	statusBarItemNotShowing = false;
		// }

		if (!vscode.window.activeTextEditor) {
			typeDisposable.dispose();
			return;
		}

		if (arg.text === '\n') {         // on Enter, exit

			// sbItem.dispose();
			// statusBarItemNotShowing = true;
			typeDisposable.dispose();
			return;
		}

		// if (kbARG) arg.text = kbARG;

		const editor = vscode.window.activeTextEditor;
		const selections = editor.selections;

		selections.forEach((selection, index) => {

			let curPos = selection.active;  // cursor Position
			let queryObject;

			if (restrict) {
				queryObject = getQueryLineIndexForward(curPos, arg.text);
			}
			else {
				queryObject = getQueryDocumentIndexForward(curPos, arg.text);
			}

			if ((queryObject.cursorIndex !== -1) && (queryObject.queryIndex !== -1)) {

				let queryPos;  // query Position
				if (putCursorForward === "afterCharacter") queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.cursorIndex + 1);
				else queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.cursorIndex);

				selections[index] = new vscode.Selection(queryPos, queryPos);
				editor.selections = selections;
			}
		});
		typeDisposable.dispose();
	});
}

/**
 * Move cursor forward to next chosen character, with selection from cursor to character
 * @param {Boolean} restrict
 * @param {string} putCursorForward
 */
exports.jumpForwardSelect = function (restrict, putCursorForward) {

	let typeDisposable = vscode.commands.registerCommand('type', arg => {

		if (!vscode.window.activeTextEditor) {
			typeDisposable.dispose();
			return;
		}

		if (arg.text === '\n') {         // on Enter, exit
			typeDisposable.dispose();
			return;
		}

		const editor = vscode.window.activeTextEditor;
		const selections = editor.selections;

		selections.forEach((selection, index) => {

			let curPos = selection.active;
			let queryObject;

			if (restrict) {
				queryObject = getQueryLineIndexForward(curPos, arg.text);
			}
			else {
				queryObject = getQueryDocumentIndexForward(curPos, arg.text);
			}

			if ((queryObject.cursorIndex !== -1) && (queryObject.queryIndex !== -1)) {

				let queryPos;
				if (putCursorForward === "afterCharacter") queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.cursorIndex + 1);
				else queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.cursorIndex);

				selections[index] = new vscode.Selection(curPos, queryPos);
				editor.selections = selections;
			}
		});
		typeDisposable.dispose();
	});
}


/**
 * Move cursor backward to previous chosen character, without selection
 * @param {Boolean} restrict
 * @param {string} putCursorBackward
 */
exports.jumpBackward = function (restrict, putCursorBackward) {

	let typeDisposable = vscode.commands.registerCommand('type', arg => {

		if (!vscode.window.activeTextEditor) {
			typeDisposable.dispose();
			return;
		}

		if (arg.text === '\n') {         // on Enter, exit
			typeDisposable.dispose();
			return;
		}

		const editor = vscode.window.activeTextEditor;
		const selections = editor.selections;

		selections.forEach((selection, index) => {

			let curPos = selection.active;
			let queryObject;

			if (restrict) {
				queryObject = getQueryLineIndexBackward(curPos, arg.text);
			}
			else {
				queryObject = getQueryDocumentIndexBackward(curPos, arg.text);
			}

			if ((queryObject.cursorIndex !== -1) && (queryObject.queryIndex !== -1)) {

				let queryPos;

				if (putCursorBackward === "afterCharacter") {
					if (restrict) queryPos = new vscode.Position(curPos.line, queryObject.queryIndex+1);
					else queryPos = editor.document.positionAt(queryObject.queryIndex+1);
				}
				else {
					if (restrict) queryPos = new vscode.Position(curPos.line, queryObject.queryIndex);
					else queryPos = editor.document.positionAt(queryObject.queryIndex);
				}

				selections[index] = new vscode.Selection(queryPos, queryPos);
				editor.selections = selections;
			}
		});
		typeDisposable.dispose();
	});
}


/**
 * Move cursor backward to previous chosen character, with selection from cursor to character
 * @param {Boolean} restrict
 * @param {string} putCursorBackward
 */
exports.jumpBackwardSelect = function (restrict, putCursorBackward) {

	let typeDisposable = vscode.commands.registerCommand('type', arg => {

		if (!vscode.window.activeTextEditor) {
			typeDisposable.dispose();
			return;
		}

		if (arg.text === '\n') {         // on Enter, exit
			typeDisposable.dispose();
			return;
		}

		const editor = vscode.window.activeTextEditor;
		const selections = editor.selections;

		selections.forEach((selection, index) => {

			let curPos = selection.active;
			let queryObject;

			if (restrict) {
				queryObject = getQueryLineIndexBackward(curPos, arg.text);
			}
			else {
				queryObject = getQueryDocumentIndexBackward(curPos, arg.text);
			}

			if ((queryObject.cursorIndex !== -1) && (queryObject.queryIndex !== -1)) {

				let queryPos;

				if (putCursorBackward === "afterCharacter") {
					if (restrict) queryPos = new vscode.Position(curPos.line, queryObject.queryIndex+1);
					else queryPos = editor.document.positionAt(queryObject.queryIndex+1);
				}
				else {
					if (restrict) queryPos = new vscode.Position(curPos.line, queryObject.queryIndex);
					else queryPos = editor.document.positionAt(queryObject.queryIndex);
				}

				selections[index] = new vscode.Selection(curPos, queryPos);
				editor.selections = selections;
			}
		});
		typeDisposable.dispose();
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
 *
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