const vscode = require('vscode');
const statusBarItem = require('./statusBar');

var global = Function('return this')();  // used for global.typeDisposable

/**
 * The Object returned contains the index of the matched query or -1,
 *   the index of the updated cursor location and the length of the match
 *
 * @typedef  {Object} QueryObject
 * @property {Number} queryIndex  - index of query character in line or document from cursor
 * @property {Number} matchLength - the length of the match, esp. useful for regexp's
 */

const noMatchQueryObject = {
  queryIndex: -1,
  matchLength: -1
}

// -------------------------------------------------------------------------------------------

/**
 * Register the 'type' command and run runJump() in it.
 * 
 * @param {string} restrictSearch - search forward in current line or document
 * @param {string} putCursor - move cursor before/after character typed
 * @param {boolean} multiMode - in MultiMode?
 * @param {boolean} select - in select?
 * @param {Function} runJump - function, _jumpForward or _jumpBackward
 */
async function typeRegisterAndRunJumps(restrictSearch, putCursor, multiMode, select, runJump) {

  global.typeDisposable = vscode.commands.registerCommand('type', async arg => {

    if (arg.text === '\n') {
      await statusBarItem.hide();
      await global.typeDisposable.dispose();
      return;
    }

    runJump(restrictSearch, putCursor, arg.text, select);
    if (!multiMode) await global.typeDisposable.dispose();
  });
}


/**
 * Move cursor forward to next chosen character, without selection
 * @param {string} restrictSearch - search forward in current line or document
 * @param {string} putCursor - move cursor before/after character typed
 * @param {string} kbText - keybinding text, if any or empty string
 * @param {boolean} multiMode - in MultiMode?
 * @param {boolean} select - in select?
 */
exports.jumpForward = async function (restrictSearch, putCursor, kbText, multiMode, select) {

  if (multiMode && !global.statusBarItemVisible) await statusBarItem.show();

  // kbText = triggered via a keybinding with a text arg
  if (kbText && !multiMode) _jumpForward(restrictSearch, putCursor, kbText, select);

  else if (kbText && multiMode) {
    _jumpForward(restrictSearch, putCursor, kbText, select);
    await typeRegisterAndRunJumps(restrictSearch, putCursor, multiMode, select, _jumpForward);
  }

  else await typeRegisterAndRunJumps(restrictSearch, putCursor, multiMode, select, _jumpForward);
};


/**
 * Move cursor backward to previous chosen character, without selection
 * @param {string} restrictSearch - search backward in current line or document
 * @param {string} putCursor - move cursor before/after character typed
 * @param {string} kbText - keybinding text, if any or empty string
 * @param {boolean} multiMode - in MultiMode?
 * @param {boolean} select - in select?
 */
exports.jumpBackward = async function (restrictSearch, putCursor, kbText, multiMode, select) {

  if (multiMode && !global.statusBarItemVisible) await statusBarItem.show();

  // kbText = triggered via a keybinding with a text arg
  if (kbText && !multiMode) _jumpBackward(restrictSearch, putCursor, kbText, select);

  else if (kbText && multiMode) {
    _jumpBackward(restrictSearch, putCursor, kbText, select);
    await typeRegisterAndRunJumps(restrictSearch, putCursor, multiMode, select, _jumpBackward);
  }

  else await typeRegisterAndRunJumps(restrictSearch, putCursor, multiMode, select, _jumpBackward);
};


/**
 * Move cursor forward to next chosen character, without selection, and reveal if necessary
 * @param {string} restrictSearch
 * @param {string} putCursorForward
 * @param {string} query - keybinding arg or next character typed
 * @param {boolean} select
 */
function _jumpForward(restrictSearch, putCursorForward, query, select) {

  if (!vscode.window.activeTextEditor) {
    return;
  }
  const editor = vscode.window.activeTextEditor;
  const selections = editor.selections;

  selections.forEach((selection, index) => {

    let curPos = selection.active;  // cursor Position
    let curAnchor = selection.anchor; // start of selection - not where the cursor is
    let cursorIndex = editor.document.offsetAt(curPos);
    
    let queryObject;

    if (restrictSearch === "line") {
      queryObject = getQueryLineIndexForward(curPos, query, putCursorForward, selection);
    }
    else {
      queryObject = getQueryDocumentIndexForward(curPos, query, putCursorForward, selection);
    }

    if (queryObject.queryIndex !== -1) { // TODO: need both?

      let queryPos;  // query Position
      if (putCursorForward === "afterCharacter") {
        const finalCurPos = queryObject.queryIndex + cursorIndex + queryObject.matchLength;
        queryPos = editor.document.positionAt(finalCurPos);
      }
      // effective default = "beforeCharacter"
      else queryPos = editor.document.positionAt(queryObject.queryIndex + cursorIndex);

      // if selection.anchor > selection.active, swap them = selection.isReversed = true
      if (select && selections[index].isReversed) curAnchor = selections[index].active;

      if (select) selections[index] = new vscode.Selection(curAnchor, queryPos);
      else selections[index] = new vscode.Selection(queryPos, queryPos);
    }
  });

  editor.selections = selections;

  // editor.revealRange(new vscode.Range(selections[0].anchor, selections[0].active), vscode.TextEditorRevealType.InCenterIfOutsideViewport);     // InCenterIfOutsideViewport = 2
  editor.revealRange(new vscode.Range(selections[0].anchor, selections[0].active), vscode.TextEditorRevealType.Default);  // Default = 0, as little scrolling as necessary
}


/**
 * Move cursor backward to next chosen character, without selection
 * @param {string} restrictSearch
 * @param {string} putCursorBackward
 * @param {string} query - keybinding arg or next character typed
 * @param {boolean} select 
 */
function _jumpBackward(restrictSearch, putCursorBackward, query, select) {

  if (!vscode.window.activeTextEditor) {
    return;
  }
  const editor = vscode.window.activeTextEditor;
  const selections = editor.selections;

  selections.forEach((selection, index) => {

    let curPos = selection.active;
    let curAnchor = selection.anchor; // start of selection - not where the cursor is

    let queryObject;

    if (restrictSearch === "line") {
      queryObject = getQueryLineIndexBackward(curPos, query, putCursorBackward, selection);
    }
    else {
      queryObject = getQueryDocumentIndexBackward(curPos, query, putCursorBackward, selection);
    }

    if (queryObject.queryIndex !== -1) {

      let queryPos;

      if (putCursorBackward === "afterCharacter") {
        if (restrictSearch === "line") queryPos = new vscode.Position(curPos.line, queryObject.queryIndex + queryObject.matchLength);
        else queryPos = editor.document.positionAt(queryObject.queryIndex + queryObject.matchLength);
      }
      else {   // (putCursorBackward === "afterCharacter") effective default
        if (restrictSearch === "line") queryPos = new vscode.Position(curPos.line, queryObject.queryIndex);
        else queryPos = editor.document.positionAt(queryObject.queryIndex);
      }

      // if selection.anchor < selection.active, swap them = selection.isReversed = false
      if (select && !selections[index].isReversed) curAnchor = selections[index].active;

      if (select) selections[index] = new vscode.Selection(curAnchor, queryPos);
      else selections[index] = new vscode.Selection(queryPos, queryPos);
    }
  });

  editor.selections = selections;

  // editor.revealRange(new vscode.Range(selections[0].anchor, selections[0].active), vscode.TextEditorRevealType.InCenterIfOutsideViewport);     // InCenterIfOutsideViewport = 2
  editor.revealRange(new vscode.Range(selections[0].anchor, selections[0].active), vscode.TextEditorRevealType.Default);  // Default = 0, as little scrolling as necessary
}


/**
 *  Get the next query position restricted to the line of the cursor
 * @param {vscode.Position} cursorPosition
 * @param {string} query - the typed character to match
 * @param {string} putCursorForward - before/afterCharacter
 * @param {vscode.Selection} selection
 * @returns {QueryObject}
 */
function getQueryLineIndexForward(cursorPosition, query, putCursorForward, selection) {

  const document = vscode.window.activeTextEditor?.document;

  let queryIndex = -1;  // the match point as an index of the line
  let matchLength = 0;
  let restOfLine = '';

  if (!document) return noMatchQueryObject;    
    
  const line = document.lineAt(cursorPosition.line);
  const lineRange = line.range;

  if (query === '$') {
    
    // leave as is
    // if (selection.isReversed && !selection.isSingleLine) {    // a reversed multiline selection
    
    return {
      queryIndex: lineRange.end.character - cursorPosition.character,
      matchLength: 0
    };
  }

  if (selection.isReversed) restOfLine = line.text.substring(selection.anchor.character);
  else restOfLine = line.text.substring(cursorPosition.character);

  if (restOfLine) {   // restOfLine if already at end = ''

    let matchPos;

    if (putCursorForward === 'beforeCharacter') {
      matchPos = restOfLine.substring(query.length).indexOf(query);  // if no match
      if (matchPos !== -1) matchPos += query.length;
    }
    else matchPos = restOfLine.indexOf(query);

    if (matchPos !== -1) {
      if (selection.isReversed) queryIndex = document.offsetAt(selection.end) - document.offsetAt(selection.start) + matchPos;
      else queryIndex = matchPos;

      matchLength = query.length;
    }
  }
  return {
    queryIndex,
    matchLength
  };
}


/**
 * Get the next query position anywhere in the document after the cursor
 * @param {vscode.Position} cursorPosition
 * @param {string} query - the typed character to match
 * @param {string} putCursorForward
 * @param {vscode.Selection} selection 
 * @returns {QueryObject}
 */
function getQueryDocumentIndexForward(cursorPosition, query, putCursorForward, selection) {

  const document = vscode.window.activeTextEditor?.document;  // TODO: exclude schemes like vscode-data, etc.

  let queryIndex = -1;
  let matchLength = 0;
  let restOfText = '';

  if (!document) return noMatchQueryObject; 
  
  let cursorIndex = document?.offsetAt(cursorPosition);

  if (query === '$') {  // this line end, if already at line end go to next line end
    const line = document.lineAt(cursorPosition.line);
    const lineRange = line.range;
    let nextLine;
    if (cursorPosition.line !== document.lineCount - 1) nextLine = document.lineAt(cursorPosition.line + 1);

    if (selection.isReversed && !selection.isSingleLine) {   // a reversed multiline selection
      
      const lineOfSelectionEnd = document.lineAt(selection.end.line);
      let lineAfterSelectionEnd;
      
      if (selection.end.line !== document.lineCount - 1) lineAfterSelectionEnd = document.lineAt(selection.end.line + 1);
      if (!lineAfterSelectionEnd) return noMatchQueryObject;
    
      // at end of line already (reverse selection) and there is a lineAfterSelectionEnd
      if (selection.end.isEqual(lineOfSelectionEnd.range.end)) {
        
        let eolLength = 1;
        if (document.eol === vscode.EndOfLine.CRLF) eolLength = 2; // correct for Windows CRLF
        // else if (document.eol === vscode.EndOfLine.LF) eolLength = 1; // correct for Mac/etc. LF

        return {
          queryIndex: document.offsetAt(selection.end) - document.offsetAt(selection.start) + lineAfterSelectionEnd.text.length + eolLength,
          matchLength: 0
        };
      }
      else if (cursorPosition.isBefore(lineRange.end)) {       // not at end of currentLine 
        // range of the selection union with the line where the selection ends
        const rangeToEnd = selection.union(lineOfSelectionEnd.range);
        return {
          queryIndex: document.offsetAt(rangeToEnd.end) - document.offsetAt(rangeToEnd.start),
          matchLength: 0
        };
      }
    }
    else {
      // at end of line already and there is a nextLine
      if (cursorPosition.isEqual(lineRange.end) && nextLine) {
          
        let eolLength = 1;
        if (document.eol === vscode.EndOfLine.CRLF) eolLength = 2; // correct for Windows CRLF
        // else if (document.eol === vscode.EndOfLine.LF) eolLength = 1; // correct for Mac/etc. LF

        return {
          queryIndex: nextLine.range.end.character + eolLength,
          matchLength: 0
        };
      }
      else if (cursorPosition.isBefore(lineRange.end))        // not at end of currentLine 
        return {
          queryIndex: lineRange.end.character - cursorPosition.character,
          matchLength: 0
        };
    }
  }
  else if (query === '^') {
    // if there is a next line, go to its start
    let nextLine;
    
    if (cursorPosition.line !== document.lineCount - 1) nextLine = document.lineAt(cursorPosition.line + 1);
    if (!nextLine) return noMatchQueryObject;
    
    const line = document.lineAt(cursorPosition.line);
    const lineRange = line.range;

    let eolLength = 1;
    if (document.eol === vscode.EndOfLine.CRLF) eolLength = 2; // correct for Windows CRLF
    // else if (document.eol === vscode.EndOfLine.LF) eolLength = 1; // correct for Mac/etc. LF

    if (nextLine) {
      if (selection.isReversed && !selection.isSingleLine) {        // a reversed multiline selection   
        if (cursorPosition.isBefore(lineRange.end)) {
          
          const lineAfterSelectionEnd = document.lineAt(selection.end.line + 1);
          if (!lineAfterSelectionEnd) return noMatchQueryObject;
          
          return {  // not at start of the current line
            // go to start of the line after the end of the selection
            queryIndex: document.offsetAt(lineAfterSelectionEnd.range.start) - cursorIndex,
            matchLength: 0
          };
        }
        
        else if (cursorPosition.isEqual(lineRange.start)) // already at start of the current line
          return {
            // go to end of current line and add eolLength
            queryIndex: line.text.length + eolLength,
            matchLength: 0
          };
      }
      else {  // !selection.isReversed
        if (cursorPosition.isBefore(lineRange.end))
          return {  // not at start of the current line
            // go to end of current line and add eolLength
            queryIndex: line.text.length - cursorPosition.character + eolLength,
            matchLength: 0
          };
      
        else if (cursorPosition.isEqual(lineRange.start)) // already at start of the current line
          return {
            // go to end of current line and add eolLength
            queryIndex: line.text.length + eolLength,
            matchLength: 0
          };
      }
    }
  }
  else if (query === '^$') {  // next empty line
    let lastLine = document.lineAt(document.lineCount - 1);
    let curEndRange = new vscode.Range(cursorPosition, lastLine.range.end);  // to end of file
    restOfText = document.getText(curEndRange);

    const regexp = new RegExp('^(?!\n)$(?!\n)', 'gm');
    const matches = [...restOfText.matchAll(regexp)];

    if (matches.length) {
      queryIndex = Number(matches[0].index);
      matchLength = 0;
    }

    if (queryIndex === 0) {  // if on an empty line already
      if (matches.length > 1) {
        queryIndex = Number(matches[1].index);
        matchLength = 0;
      }
    }

    return {
      queryIndex,
      matchLength
    };
  }

  let curEndRange;

  let lastLine = document.lineAt(document.lineCount - 1);

  if (selection.isReversed)
    curEndRange = new vscode.Range(selection.anchor, lastLine.range.end);  // to end of file from the anchor
  else
    curEndRange = new vscode.Range(cursorPosition, lastLine.range.end);  // to the end of the file from the cursor

  restOfText = document.getText(curEndRange);

  if (restOfText) {  // restOfText = '' if already at the end

    let matchPos;

    if (putCursorForward === 'beforeCharacter') matchPos = restOfText.substring(query.length).indexOf(query) + query.length;
    else matchPos = restOfText.indexOf(query);

    if (matchPos !== -1) {
      if (selection.isReversed)
        queryIndex = document.offsetAt(selection.end) - document.offsetAt(selection.start) + matchPos;
      else queryIndex = matchPos;

      matchLength = query.length;
    }
  }
  return {
    queryIndex,
    matchLength
  };
}


/**
 * Get the previous query position restricted to the line of the cursor
 * @param {vscode.Position} cursorPosition
 * @param {string} query - the typed character to match
 * @param {string} purCursorBackward - before/afterCharacter
 * @param {vscode.Selection} selection 
 * @returns {QueryObject}
 */
function getQueryLineIndexBackward(cursorPosition, query, purCursorBackward, selection) {

  const document = vscode.window.activeTextEditor?.document;

  let queryIndex = -1;
  let matchLength = 0;
  let startOfLine = '';

  if (!document) return noMatchQueryObject; 

  if (query === '^') {
    return {
      queryIndex: 0,
      matchLength: 0
    };
  }

  const line = document.lineAt(cursorPosition.line);
  if (!selection.isReversed) startOfLine = line.text.substring(0, selection.anchor.character);
  else startOfLine = line.text.substring(0, cursorPosition.character);  // same as selection.active.character

  if (startOfLine) {   // startOfLine = '' if already at the start of the line

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
    matchLength
  };
}


/**
 * Get the previous query position anywhere in the document prior to cursor
 * @param {vscode.Position} cursorPosition
 * @param {string} query - the typed character to match
 * @param {string} purCursorBackward - before/afterCharacter
 * @param {vscode.Selection} selection 
 * @returns {QueryObject}
 */
function getQueryDocumentIndexBackward(cursorPosition, query, purCursorBackward, selection) {

  const document = vscode.window.activeTextEditor?.document;

  let queryIndex = -1;
  let matchLength = 0;
  let startText = '';

  if (!document) return noMatchQueryObject; 
  
  let cursorIndex = document?.offsetAt(cursorPosition);

  const firstLine = document.lineAt(0);
  let curStartRange;

  if (!selection.isReversed)
    curStartRange = new vscode.Range(selection.anchor, firstLine.range.end);  // to end of file from the anchor
  else
    curStartRange = new vscode.Range(cursorPosition, firstLine.range.end);  // to the end of the file from the cursor

  startText = document.getText(curStartRange);

  if (query === '$') {   // go to end of previous line
    if (!selection.isReversed && !selection.isSingleLine) {    // a !reversed multiline selection
    
      let selectionStartPreviousLine;
        
      const selectionStartLine = document.lineAt(selection.start);
      if (selectionStartLine.range.start.line !== 0)
        selectionStartPreviousLine = document.lineAt(new vscode.Position(selectionStartLine.range.start.line - 1, 0));
      else return noMatchQueryObject;      
      
      if (selectionStartPreviousLine) {

        if (selection.start.isEqual(selectionStartLine.range.end)) {  // at end of line already and there is a selectionStartPreviousLine
          return {
            queryIndex: document.offsetAt(selectionStartLine.range.end),
            matchLength: 0
          };
        }        
        else if (selection.start.isBefore(selectionStartLine.range.end)) {      // not at end of selection start line
          return {
            queryIndex: document.offsetAt(selectionStartPreviousLine.range.end),
            matchLength: 0
          };
        }
      }
    }
    else {
      let previousLine;
      if (cursorPosition.line !== 0) previousLine = document.lineAt(cursorPosition.line - 1);
      else return noMatchQueryObject;
      
      const previousLineRange = previousLine.range;  
      return {
        queryIndex: document.offsetAt(previousLineRange.end),
        matchLength: 0
      };
    }
  }

  else if (query === '^') {  // go to start of current line, if already there go to start of previous line
    const currentLine = document.lineAt(cursorPosition.line);
    const currentLineRange = currentLine.range;
    
    let previousLine;
    if (cursorPosition.line !== 0) previousLine = document.lineAt(cursorPosition.line - 1);
    else return noMatchQueryObject
    
    if (!selection.isReversed && !selection.isSingleLine) {    // a !reversed multiline selection
      
      let selectionStartPreviousLine;
      const selectionStartLine = document.lineAt(selection.start);
      
      if (selectionStartLine.range.start.line !== 0) selectionStartPreviousLine = document.lineAt(new vscode.Position(selectionStartLine.range.start.line - 1, 0));
      else return noMatchQueryObject;
      
      if (selection.start.isEqual(selectionStartLine.range.start) && selectionStartPreviousLine) {  // at start of line already and there is a previousLine
        return {
          queryIndex: document.offsetAt(selectionStartPreviousLine.range.start),
          matchLength: 0
        };
      }
      else if (selection.start.isAfter(selectionStartLine.range.start)) {      // not at start of selection start line
        return {
          queryIndex: document.offsetAt(selectionStartLine.range.start),
          matchLength: 0
        };
      }
    }
    else {
      if (cursorPosition.isEqual(currentLineRange.start) && previousLine) {  // at start of line already and there is a previousLine
        return {
          queryIndex: document.offsetAt(previousLine.range.start),
          matchLength: 0
        };
      }
      else if (cursorPosition.isAfter(currentLineRange.start))        // not at start of currentLine 
        return {
          queryIndex: document.offsetAt(currentLineRange.start),
          matchLength: 0
        };
    }
  }

  else if (query === '^$') {  // previous empty line
    
    const regexp = new RegExp('^(?!\n)$(?!\n)', 'gm');
    //  const matches = [...startText.matchAll(regexp)];
    const matches = Array.from(startText.matchAll(regexp));

    const lastIndex = matches?.at(-1)?.index ?? -1;
    const penultimateIndex = matches?.at(-2)?.index ?? -1;

    // going backward and cursor at last match, skip and go to the penultimate match
    if ((penultimateIndex !== -1) && (lastIndex !== -1) && (cursorIndex === lastIndex)) {
      queryIndex = penultimateIndex;
      matchLength = 0;
    }
    else if (lastIndex !== -1) {
      queryIndex = lastIndex;
      matchLength = 0;
    }

    return {
      queryIndex,
      matchLength
    };
  }

  if (startText) {  // startText = '' if already at the start of the document 

    let matchPos;

    if (purCursorBackward === 'afterCharacter') {
      const end = startText.length - query.length;
      matchPos = startText.substring(0, end).lastIndexOf(query);
    }
    else matchPos = startText.lastIndexOf(query);  // is case-sensitive

    if (matchPos !== -1) {
      queryIndex = matchPos;
      matchLength = query.length;
    }
  }

  return {
    queryIndex,
    matchLength
  };
}