const vscode = require('vscode');


/**
 * @description - the Object returned containing the index of the found query or -1
 * @description - and the index of the updated cursor location
 *
 * @typedef  {Object} QueryObject
 * @property {Number} queryIndex - index of query character in line or document
 * @property {Number} cursorIndex - index/offset of cursor in document
 */



/**
 * @description - move cursor forward to next chosen character, without selection
 * @param {Boolean} restrict
 * @param {string} putCursor
 */
exports.jumpForward = function (restrict, putCursor) {

	// arg === { text: "a" }, so use arg.text to get the value

	// let typeDisposable7 = vscode.commands.registerCommand('paste', arg => {
	// 	console.log(arg);   // works, and can do 'type' as well
	// });

	// let arg = vscode.window.onDidChangeActiveTextEditor  ??

	let typeDisposable = vscode.commands.registerCommand('type', arg => {

		if (!vscode.window.activeTextEditor) {
			typeDisposable.dispose();
			return;
		}

		if (arg.text === '\n') {         // Enter
			typeDisposable.dispose();
			return;
		}

		const editor = vscode.window.activeTextEditor;
		const selections = editor.selections;

		selections.forEach((selection, index) => {

			// cursor Position
			let curPos = selection.active;
			let queryObject;

			if (restrict) {
				queryObject = getQueryLineIndexForward(curPos, arg.text);
			}
			else {
				queryObject = getQueryDocumentIndexForward(curPos, arg.text);
			}

			if ((queryObject.cursorIndex !== -1) && (queryObject.queryIndex !== -1)) {
				// query Position
				let queryPos;
				if (putCursor === "afterCharacter") queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.cursorIndex + 1);
				else queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.cursorIndex);

				selections[index] = new vscode.Selection(queryPos, queryPos);
				editor.selections = selections;
			}
		});
		typeDisposable.dispose();
	});
}

/**
 * @description - move cursor forward to next chosen character, with selection from cursor to character
 * @param {Boolean} restrict
 * @param {string} putCursor
 */
exports.jumpForwardSelect = function (restrict, putCursor) {

	let typeDisposable = vscode.commands.registerCommand('type', arg => {

		if (!vscode.window.activeTextEditor) {
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
				// const queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.cursorIndex);

				let queryPos;
				if (putCursor === "afterCharacter") queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.cursorIndex + 1);
				else queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.cursorIndex);

				selections[index] = new vscode.Selection(curPos, queryPos);
				editor.selections = selections;
			}
		});
		typeDisposable.dispose();
	});
}


/**
 * @description - move cursor backward to previous chosen character, without selection
 * @param {Boolean} restrict
 * @param {string} putCursor
 */
exports.jumpBackward = function (restrict, putCursor) {

	let typeDisposable = vscode.commands.registerCommand('type', arg => {

		if (!vscode.window.activeTextEditor) {
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

				if (putCursor === "afterCharacter") {
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
 * @description - move cursor backward to previous chosen character, with selection from cursor to character
 * @param {Boolean} restrict
 * @param {string} putCursor
 */
exports.jumpBackwardSelect = function (restrict, putCursor) {

	let typeDisposable = vscode.commands.registerCommand('type', arg => {

		if (!vscode.window.activeTextEditor) {
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

				// if (restrict) queryPos = new vscode.Position(curPos.line, queryObject.queryIndex);
				// else queryPos = editor.document.positionAt(queryObject.queryIndex);

				if (putCursor === "afterCharacter") {
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
 * @description -  get the next query position restricted to the line of the cursor
 * @param {vscode.Position} cursorPosition
 * @param {string} query
 *
 * @returns {QueryObject}
 */
function getQueryLineIndexForward(cursorPosition, query) {

	let queryIndex = -1;
	let cursorIndex = vscode.window.activeTextEditor?.document.offsetAt(cursorPosition) || -1;
	const editor = vscode.window.activeTextEditor;

	if (editor) {

		let restOfLine = editor.document.lineAt(cursorPosition.line).text.substring(cursorPosition.character);
		queryIndex = restOfLine.indexOf(query);

		if (queryIndex === 0) {
			cursorPosition = new vscode.Position(cursorPosition.line, cursorPosition.character + 1);
			queryIndex = restOfLine.substring(1).indexOf(query);
			cursorIndex = editor.document.offsetAt(cursorPosition);
		}
	}
	return {
		queryIndex: queryIndex,
		cursorIndex: cursorIndex
	}
}

/**
 * @description -  get the next query position anywhere in the document after the cursor
 * @param {vscode.Position} cursorPosition
 * @param {string} query
 *
 * @returns {QueryObject}
 */
function getQueryDocumentIndexForward(cursorPosition, query) {

	let queryIndex = -1;
	let cursorIndex = vscode.window.activeTextEditor?.document.offsetAt(cursorPosition) || -1;
	const editor = vscode.window.activeTextEditor;

	if (editor) {

		let lastLine = editor.document.lineAt(editor.document.lineCount - 1);
		let curEndRange = new vscode.Range(cursorPosition, lastLine.range.end);
		queryIndex = editor.document.getText(curEndRange).indexOf(query);

		if (queryIndex === 0) {
			cursorPosition = new vscode.Position(cursorPosition.line, cursorPosition.character + 1);
			curEndRange = new vscode.Range(cursorPosition, lastLine.range.end);
			queryIndex = editor.document.getText(curEndRange).indexOf(query);

			if (queryIndex !== -1)
				cursorIndex = editor.document.offsetAt(cursorPosition);
		}
	}
	return  {
		queryIndex: queryIndex,
		cursorIndex: cursorIndex
	}
}


/**
 * @description - get the previous query position restricted to the line of the cursor
 *
 * @param {vscode.Position} cursorPosition
 * @param {string} query *
 * @returns {QueryObject}
 */
function getQueryLineIndexBackward(cursorPosition, query) {

	let queryIndex = -1;
	let cursorIndex = vscode.window.activeTextEditor?.document.offsetAt(cursorPosition) || -1;
	const editor = vscode.window.activeTextEditor;

	if (editor) {

		let startOfLine = editor.document.lineAt(cursorPosition.line).text.substring(0, cursorPosition.character);
		queryIndex = startOfLine.lastIndexOf(query);

		// if (queryIndex === cursorIndex-1) {
		// 	cursorPosition = new vscode.Position(cursorPosition.line, cursorPosition.character - 1);
		// 	queryIndex = startOfLine.substr(0, cursorPosition.character).lastIndexOf(query);
		// 	cursorIndex = editor.document.offsetAt(cursorPosition);
		// }
	}
	return {
		queryIndex: queryIndex,
		cursorIndex: cursorIndex
	}
}

/**
 * @description - get the previous query position anywhere in the document prior to cursor
 * @param {vscode.Position} cursorPosition
 * @param {string} query
 *
 * @returns {QueryObject}
 */
function getQueryDocumentIndexBackward(cursorPosition, query) {

	let queryIndex = -1;
	let cursorIndex = vscode.window.activeTextEditor?.document.offsetAt(cursorPosition) || -1;
	const editor = vscode.window.activeTextEditor;

	if (editor) {

		const firstLine = editor.document.lineAt(0);
		let curStartRange = new vscode.Range(cursorPosition, firstLine.range.start);

		queryIndex = editor.document.getText(curStartRange).lastIndexOf(query);

		// if queryIndex === curIndex-1, skip it backward and jump to previous
		// if (queryIndex === cursorIndex-1) {
		// 	cursorPosition = new vscode.Position(cursorPosition.line, cursorPosition.character - 1);
		// 	curStartRange = new vscode.Range(cursorPosition, firstLine.range.start);
		// 	queryIndex = editor.document.getText(curStartRange).lastIndexOf(query);

		// 	if (queryIndex !== -1)
		// 	cursorIndex = editor.document.offsetAt(cursorPosition);
		// }
	}

	return  {
		queryIndex: queryIndex,
		cursorIndex: cursorIndex
	}
}