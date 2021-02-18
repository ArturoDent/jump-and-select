const vscode = require('vscode');

exports.jumpForward = function () {

		// arg === { text: "a" }

		let typeDisposable = vscode.commands.registerCommand('type', arg => {

			const editor = vscode.window.activeTextEditor;
			const selections = editor.selections;

			selections.forEach((selection, index) => {

				let curPos = selection.active;
				let curIndex = editor.document.offsetAt(curPos);

				const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
				let curEndRange = new vscode.Range(curPos, lastLine.range.end);

				let queryIndex = editor.document.getText(curEndRange).indexOf(arg.text);

				// if queryIndex === 0, skip it forward and jump to next
				if (queryIndex === 0) {
					curPos = new vscode.Position(curPos.line, curPos.character + 1);
			 	 	curEndRange = new vscode.Range(curPos, lastLine.range.end);
					queryIndex = editor.document.getText(curEndRange).indexOf(arg.text);
					curIndex = editor.document.offsetAt(curPos);
				}

				const queryPos = editor.document.positionAt(queryIndex + curIndex);

				// to jump only
				if (queryIndex !== -1) 	selections[index] = new vscode.Selection(queryPos, queryPos);
			});

			editor.selections = selections;

			typeDisposable.dispose();
		});
}


exports.jumpForwardSelect = function () {

		let typeDisposable = vscode.commands.registerCommand('type', arg => {

			const editor = vscode.window.activeTextEditor;
			const selections = editor.selections;

			selections.forEach((selection, index) => {

				let curPos = selection.active;
				let curIndex = editor.document.offsetAt(curPos);

				const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
				let curEndRange = new vscode.Range(curPos, lastLine.range.end);

				let queryIndex = editor.document.getText(curEndRange).indexOf(arg.text);

				// if queryIndex === 0, skip it forward and jump to next
				if (queryIndex === 0) {
					curPos = new vscode.Position(curPos.line, curPos.character + 1);
			 	 	curEndRange = new vscode.Range(curPos, lastLine.range.end);
					queryIndex = editor.document.getText(curEndRange).indexOf(arg.text);
					curIndex = editor.document.offsetAt(curPos);
				}

				const queryPos = editor.document.positionAt(queryIndex + curIndex);

				// to select from cursor to queryPos
				if (queryIndex !== -1) selections[index] = new vscode.Selection(curPos, queryPos);
			});

			editor.selections = selections;

			typeDisposable.dispose();
		});
}

exports.jumpBackward = function () {

		let typeDisposable = vscode.commands.registerCommand('type', arg => {

			const editor = vscode.window.activeTextEditor;
			const selections = editor.selections;

			selections.forEach((selection, index) => {

				let curPos = selection.active;
				let curIndex = editor.document.offsetAt(curPos);

				const firstLine = editor.document.lineAt(0);
				let curStartRange = new vscode.Range(curPos, firstLine.range.start);
				// const curStartRange = new vscode.Range(firstLine.range.start, curPos);  // directionality?

				let queryIndex = editor.document.getText(curStartRange).lastIndexOf(arg.text);
				let queryPos = editor.document.positionAt(queryIndex+1);


				// if queryIndex === curIndex-1, skip it backward and jump to previous
				if (queryIndex === curIndex-1) {
					curPos = new vscode.Position(curPos.line, curPos.character - 1);
			 	 	curStartRange = new vscode.Range(curPos, firstLine.range.start);
					queryIndex = editor.document.getText(curStartRange).lastIndexOf(arg.text);
					queryPos = editor.document.positionAt(queryIndex+1);
				}

					// to jump backwards only
				if (queryIndex !== -1) selections[index] = new vscode.Selection(queryPos, queryPos);
			});

			editor.selections = selections;

			typeDisposable.dispose();
		});
}

exports.jumpBackwardSelect = function () {

		let typeDisposable = vscode.commands.registerCommand('type', arg => {

			const editor = vscode.window.activeTextEditor;
			const selections = editor.selections;

			selections.forEach((selection, index) => {

				let curPos = selection.active;
				let curIndex = editor.document.offsetAt(curPos);

				const firstLine = editor.document.lineAt(0);
				let curStartRange = new vscode.Range(curPos, firstLine.range.start);

				let queryIndex = editor.document.getText(curStartRange).lastIndexOf(arg.text);
				let queryPos = editor.document.positionAt(queryIndex+1);

				// if queryIndex === curIndex-1, skip it backward and jump to previous
				if (queryIndex === curIndex-1) {
					curPos = new vscode.Position(curPos.line, curPos.character - 1);
			 	 	curStartRange = new vscode.Range(curPos, firstLine.range.start);
					queryIndex = editor.document.getText(curStartRange).lastIndexOf(arg.text);
					queryPos = editor.document.positionAt(queryIndex+1);
				}

					// to select from cursor to queryPos backwards
				if (queryIndex !== -1) selections[index] = new vscode.Selection(curPos, queryPos);
			});

			editor.selections = selections;

			typeDisposable.dispose();
		});
}
