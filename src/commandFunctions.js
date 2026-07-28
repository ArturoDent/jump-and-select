const { commands, window, Range, Position, Selection, EndOfLine, TextEditorRevealType } = require('vscode');
const statusBarItem = require('./statusBar');

/**
 * The Object returned contains the index of the matched query or -1.
 * This index is from the beginning of the text to be searched.
 *
 * @typedef  { Object } QueryObject
 * @property { Number } queryIndex  - index of query character in line or document from cursor
 */
const noMatchQueryObject = { queryIndex: -1 };

// -------------------------------------------------------------------------------------------

/**
 * Remove single-backslash-escaping of '^' and '$' so they are matched literally.
 *
 * @param { string } query
 * @returns { string }
 */
function unescapeQuery(query) {
  if (query === '\\^') return '^';
  if (query === '\\$') return '$';
  // $ must precede ^ in the [], else interpreted as not ^
  return query.replaceAll(/\\([$^])/g, '$1');  // remove all double-escapes
}

/**
 * Length (in characters) of what `query` will match, accounting for the
 * special '^', '$', and '^$' queries and the document's line ending.
 *
 * @param { string } query
 * @param { import("vscode").TextEditor } editor
 * @returns { number }
 */
function getMatchLength(query, editor) {
  if (query === '^' || query === '$') return 0;
  if (query === '\\^' || query === '\\$') return 1;
  if (query === '^$') return editor.document.eol === EndOfLine.CRLF ? 2 : 1;
  return unescapeQuery(query).length;
}

// -------------------------------------------------------------------------------------------

/**
 * Register the 'type' command and run runJump() in it.
 *
 * @param { string } restrictSearch - search forward in current line or document
 * @param { string } putCursor - move cursor before/after character typed
 * @param { boolean } multiMode - in MultiMode?
 * @param { boolean } select - in select?
 * @param { Function } runJump - function, _jumpForward or _jumpBackward
 */
async function typeRegisterAndRunJumps(restrictSearch, putCursor, multiMode, select, runJump) {

  globalThis.typeDisposable = commands.registerCommand('type', async arg => {

    // a tab is not considered a character for some reason, spaces are though
    if (arg.text === '\n') {       // escape doesn't produce an arg
      await statusBarItem.hide();
      await globalThis.typeDisposable?.dispose();
      return;
    }

    await runJump(restrictSearch, putCursor, arg.text, select);
    if (!multiMode) await globalThis.typeDisposable?.dispose();
  });
}


/**
 * Move cursor forward to next chosen character, without selection
 * @param { string } restrictSearch - search forward in current line or document
 * @param { string } putCursor - move cursor before/after character typed
 * @param { string } kbText - keybinding text, if any or empty string
 * @param { boolean } multiMode - in MultiMode?
 * @param { boolean } select - in select?
 */
exports.jumpForward = async function (restrictSearch, putCursor, kbText, multiMode, select) {

  if (multiMode && !globalThis.statusBarItemVisible) await statusBarItem.show("forward");

  // kbText = triggered via a keybinding with a text arg
  if (kbText) {
    await _jumpForward(restrictSearch, putCursor, kbText, select);
    if (!multiMode) return;
  }

  await typeRegisterAndRunJumps(restrictSearch, putCursor, multiMode, select, _jumpForward);
};


/**
 * Move cursor backward to previous chosen character, without selection
 * @param { string } restrictSearch - search backward in current line or document
 * @param { string } putCursor - move cursor before/after character typed
 * @param { string } kbText - keybinding text, if any or empty string
 * @param { boolean } multiMode - in MultiMode?
 * @param { boolean } select - in select?
 */
exports.jumpBackward = async function (restrictSearch, putCursor, kbText, multiMode, select) {

  if (multiMode && !globalThis.statusBarItemVisible) await statusBarItem.show("backward");

  // kbText = triggered via a keybinding with a text arg
  if (kbText) {
    await _jumpBackward(restrictSearch, putCursor, kbText, select);
    if (!multiMode) return;
  }

  await typeRegisterAndRunJumps(restrictSearch, putCursor, multiMode, select, _jumpBackward);
};


/**
 * Move cursor forward to next chosen character, without selection, and reveal if necessary
 * @param { string } restrictSearch
 * @param { string } putCursorForward
 * @param { string } query - keybinding arg or next character typed
 * @param { boolean } select
 */
async function _jumpForward(restrictSearch, putCursorForward, query, select) {

  if (!window.activeTextEditor) return;

  const editor = window.activeTextEditor;
  const matchLength = getMatchLength(query, editor);

  const newSelections = [...editor.selections];

  newSelections.forEach((selection, index) => {

    const curPos = selection.active;  // cursor Position
    let curAnchor = selection.anchor; // start of selection - not where the cursor is
    const cursorIndex = editor.document.offsetAt(curPos);

    const queryObject = restrictSearch === "line"
      ? getQueryLineIndexForward(curPos, query, putCursorForward, selection)
      : getQueryDocumentIndexForward(curPos, query, putCursorForward, selection);

    if (queryObject.queryIndex === -1) return;

    let queryPos;  // query Position
    if (putCursorForward === "afterCharacter") {
      const finalCurPos = queryObject.queryIndex + cursorIndex + matchLength;
      queryPos = editor.document.positionAt(finalCurPos);
    }
    // effective default = "beforeCharacter"
    else queryPos = editor.document.positionAt(queryObject.queryIndex + cursorIndex);

    // if selection.anchor > selection.active, swap them = selection.isReversed = true
    if (select && selection.isReversed) curAnchor = selection.active;

    newSelections[index] = select ? new Selection(curAnchor, queryPos) : new Selection(queryPos, queryPos);
  });

  editor.selections = newSelections;
  editor.revealRange(new Range(newSelections[0].anchor, newSelections[0].active), TextEditorRevealType.Default);  // Default = 0, as little scrolling as necessary
}


/**
 * Move cursor backward to next chosen character, without selection
 * @param { string } restrictSearch
 * @param { string } putCursorBackward
 * @param { string } query - keybinding arg or next character typed
 * @param { boolean } select
 */
async function _jumpBackward(restrictSearch, putCursorBackward, query, select) {

  if (!window.activeTextEditor) return;

  const editor = window.activeTextEditor;
  const matchLength = getMatchLength(query, editor);

  const newSelections = [...editor.selections];

  newSelections.forEach((selection, index) => {

    const curPos = selection.active;
    let curAnchor = selection.anchor; // start of selection - not where the cursor is

    const queryObject = restrictSearch === "line"
      ? getQueryLineIndexBackward(curPos, query, putCursorBackward, selection)
      : getQueryDocumentIndexBackward(curPos, query, putCursorBackward, selection);

    if (queryObject.queryIndex === -1) return;

    let queryPos;
    if (putCursorBackward === "afterCharacter") {
      queryPos = restrictSearch === "line"
        ? new Position(curPos.line, queryObject.queryIndex + matchLength)
        : editor.document.positionAt(queryObject.queryIndex + matchLength);
    }
    else {   // (putCursorBackward === "beforeCharacter") effective default
      queryPos = restrictSearch === "line"
        ? new Position(curPos.line, queryObject.queryIndex)
        : editor.document.positionAt(queryObject.queryIndex);
    }

    // if selection.anchor < selection.active, swap them = selection.isReversed = false
    if (select && !selection.isReversed) curAnchor = selection.active;

    newSelections[index] = select ? new Selection(curAnchor, queryPos) : new Selection(queryPos, queryPos);
  });

  editor.selections = newSelections;
  editor.revealRange(new Range(newSelections[0].anchor, newSelections[0].active), TextEditorRevealType.Default);  // Default = 0, as little scrolling as necessary
}


/**
 *  Get the next query position restricted to the line of the cursor
 * @param { Position } cursorPosition
 * @param { string } query - the typed character to match
 * @param { string } putCursorForward - before/afterCharacter
 * @param { Selection } selection
 *
 * @returns { QueryObject }
 */
function getQueryLineIndexForward(cursorPosition, query, putCursorForward, selection) {

  const document = window.activeTextEditor?.document;

  let queryIndex = -1;  // the match point as an index of the line
  let restOfLine = '';

  if (!document) return noMatchQueryObject;

  const line = document.lineAt(cursorPosition.line);
  const lineRange = line.range;

  if (query === '$') {
    return { queryIndex: lineRange.end.character - cursorPosition.character };
  }

  query = unescapeQuery(query);

  if (selection.isReversed) restOfLine = line.text.substring(selection.anchor.character);
  else restOfLine = line.text.substring(cursorPosition.character);

  if (restOfLine) {   // else restOfLine if already at end = ''

    let matchPos;

    if (putCursorForward === 'beforeCharacter') {
      matchPos = restOfLine.substring(query.length).indexOf(query);
      if (matchPos !== -1) matchPos += query.length;
    }
    else matchPos = restOfLine.indexOf(query);

    if (matchPos !== -1) {
      if (selection.isReversed) queryIndex = document.offsetAt(selection.end) - document.offsetAt(selection.start) + matchPos;
      else queryIndex = matchPos;
    }
  }
  return { queryIndex };
}


/**
 * Get the next query position anywhere in the document after the cursor
 * @param { Position } cursorPosition
 * @param { string } query - the typed character to match
 * @param { string } putCursorForward
 * @param { Selection } selection
 *
 * @returns { QueryObject }
 */
function getQueryDocumentIndexForward(cursorPosition, query, putCursorForward, selection) {

  const document = window.activeTextEditor?.document;

  let queryIndex = -1;
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
      const rangeToEnd = selection.union(lineOfSelectionEnd.range);

      return {
        queryIndex: document.offsetAt(rangeToEnd.end) - document.offsetAt(rangeToEnd.start)
      };
    }
    else {
      // at end of line already and there is a nextLine
      if (cursorPosition.isEqual(lineRange.end) && !!nextLine) {

        let eolLength = 1;
        if (document.eol === EndOfLine.CRLF) eolLength = 2; // correct for Windows CRLF

        return { queryIndex: nextLine.range.end.character + eolLength };
      }
      else if (cursorPosition.isBefore(lineRange.end))        // not at end of currentLine
        return { queryIndex: lineRange.end.character - cursorPosition.character };
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
    if (document.eol === EndOfLine.CRLF) eolLength = 2; // correct for Windows CRLF

    if (nextLine) {
      if (selection.isReversed && !selection.isSingleLine) {  // a reversed multiline selection

        const lineAfterSelectionEnd = document.lineAt(selection.end.line + 1);
        if (!lineAfterSelectionEnd) return noMatchQueryObject;

        if (cursorPosition.isBefore(lineRange.end)) {
          // go to start of the line after the end of the selection
          return { queryIndex: document.offsetAt(lineAfterSelectionEnd.range.start) - cursorIndex };
        }

        if (cursorPosition.isEqual(lineRange.end))  // go to end of current line and add eolLength
          return { queryIndex: document.offsetAt(lineAfterSelectionEnd.range.start) - cursorIndex };

        else if (cursorPosition.isEqual(lineRange.start)) // already at start of the current line
          // go to end of current line and add eolLength
          return { queryIndex: line.text.length + eolLength };
      }
      else {  // !selection.isReversed
        if (cursorPosition.isBefore(lineRange.end))  // go to end of current line and add eolLength
          return { queryIndex: line.text.length - cursorPosition.character + eolLength };

        if (cursorPosition.isEqual(lineRange.end))  // go to end of current line and add eolLength
          return { queryIndex: eolLength };

        else if (cursorPosition.isEqual(lineRange.start)) // already at start of the current line
          // go to end of current line and add eolLength
          return { queryIndex: line.text.length + eolLength };
      }
    }
  }
  else if (query === '^$') {  // next empty line
    let lastLine = document.lineAt(document.lineCount - 1);
    let curEndRange = new Range(cursorPosition, lastLine.range.end);  // to end of file
    restOfText = document.getText(curEndRange);

    const match = restOfText.match(/(?<=\r?\n)\r?\n/);

    if (!match) {
      if (restOfText.endsWith('\r\n')) queryIndex = restOfText.lastIndexOf('\r\n') + 2;
      else if (restOfText.endsWith('\n')) queryIndex = restOfText.lastIndexOf('\n') + 1;
      else return { queryIndex };
    }

    return { queryIndex: match?.index || queryIndex };
  }

  query = unescapeQuery(query);

  let curEndRange;
  let lastLine = document.lineAt(document.lineCount - 1);

  if (selection.isReversed)
    curEndRange = new Range(selection.anchor, lastLine.range.end);  // to end of file from the anchor
  else
    curEndRange = new Range(cursorPosition, lastLine.range.end);  // to the end of the file from the cursor

  restOfText = document.getText(curEndRange);

  if (restOfText) {  // restOfText = '' if already at the end

    let matchPos;

    if (putCursorForward === 'beforeCharacter') {
      matchPos = restOfText.substring(query.length).indexOf(query);
      if (matchPos !== -1) matchPos += query.length;
    }
    else matchPos = restOfText.indexOf(query);

    if (matchPos !== -1) {
      if (selection.isReversed)
        queryIndex = document.offsetAt(selection.end) - document.offsetAt(selection.start) + matchPos;
      else queryIndex = matchPos;
    }
  }
  return { queryIndex };
}


/**
 * Get the previous query position restricted to the line of the cursor
 * @param { Position } cursorPosition
 * @param { string } query - the typed character to match
 * @param { string } putCursorBackward - before/afterCharacter
 * @param { Selection } selection
 *
 * @returns { QueryObject }
 */
function getQueryLineIndexBackward(cursorPosition, query, putCursorBackward, selection) {

  const document = window.activeTextEditor?.document;

  let queryIndex = -1;
  let startOfLine = '';

  if (!document) return noMatchQueryObject;

  if (query === '^') return { queryIndex: 0 };

  query = unescapeQuery(query);

  const line = document.lineAt(cursorPosition.line);
  if (!selection.isReversed) startOfLine = line.text.substring(0, selection.anchor.character);
  else startOfLine = line.text.substring(0, cursorPosition.character);  // same as selection.active.character

  if (startOfLine) {   // startOfLine = '' if already at the start of the line

    let matchPos;

    if (putCursorBackward === 'afterCharacter') {
      const end = startOfLine.length - query.length;
      matchPos = startOfLine.substring(0, end).lastIndexOf(query);
    }
    else matchPos = startOfLine.lastIndexOf(query);  // is case-sensitive

    if (matchPos !== -1) {
      queryIndex = matchPos;
    }
  }
  return { queryIndex };
}


/**
 * Get the previous query position anywhere in the document prior to cursor
 * @param { Position } cursorPosition
 * @param { string } query - the typed character to match
 * @param { string } putCursorBackward - before/afterCharacter
 * @param { Selection } selection
 *
 * @returns { QueryObject }
 */
function getQueryDocumentIndexBackward(cursorPosition, query, putCursorBackward, selection) {

  const document = window.activeTextEditor?.document;

  let queryIndex = -1;
  let startText = '';

  if (!document) return noMatchQueryObject;

  let cursorIndex = document?.offsetAt(cursorPosition);

  const firstLine = document.lineAt(0);
  let curStartRange;

  if (!selection.isReversed)
    curStartRange = new Range(selection.anchor, firstLine.range.start);  // to end of file from the anchor
  else
    curStartRange = new Range(cursorPosition, firstLine.range.start);  // to the start of the file from the cursor

  startText = document.getText(curStartRange);

  if (query === '$') {   // go to end of previous line
    if (!selection.isReversed && !selection.isSingleLine) {    // a !reversed multiline selection

      let selectionStartPreviousLine;

      const selectionStartLine = document.lineAt(selection.start);
      if (selectionStartLine.range.start.line !== 0)
        selectionStartPreviousLine = document.lineAt(new Position(selectionStartLine.range.start.line - 1, 0));
      else return noMatchQueryObject;

      if (selectionStartPreviousLine) {

        if (selection.start.isEqual(selectionStartLine.range.end)) {  // at end of line already and there is a selectionStartPreviousLine
          return { queryIndex: document.offsetAt(selectionStartLine.range.end) };
        }
        else if (selection.start.isBefore(selectionStartLine.range.end)) {      // not at end of selection start line
          return { queryIndex: document.offsetAt(selectionStartPreviousLine.range.end) };
        }
      }
    }
    else {
      let previousLine;
      if (cursorPosition.line !== 0) previousLine = document.lineAt(cursorPosition.line - 1);
      else return noMatchQueryObject;

      const previousLineRange = previousLine.range;
      return { queryIndex: document.offsetAt(previousLineRange.end) };
    }
  }

  else if (query === '^') {  // go to start of current line, if already there go to start of previous line
    const currentLine = document.lineAt(cursorPosition.line);
    const currentLineRange = currentLine.range;

    let previousLine;
    if (cursorPosition.line !== 0) previousLine = document.lineAt(cursorPosition.line - 1);
    else return noMatchQueryObject;

    if (!selection.isReversed && !selection.isSingleLine) {    // a !reversed multiline selection

      let selectionStartPreviousLine;
      const selectionStartLine = document.lineAt(selection.start);

      if (selectionStartLine.range.start.line !== 0) selectionStartPreviousLine = document.lineAt(new Position(selectionStartLine.range.start.line - 1, 0));
      else return noMatchQueryObject;

      if (selection.start.isEqual(selectionStartLine.range.start) && !!selectionStartPreviousLine) {  // at start of line already and there is a previousLine
        return { queryIndex: document.offsetAt(selectionStartPreviousLine.range.start) };
      }
      else if (selection.start.isAfter(selectionStartLine.range.start)) {      // not at start of selection start line
        return { queryIndex: document.offsetAt(selectionStartLine.range.start) };
      }
    }
    else {
      if (cursorPosition.isEqual(currentLineRange.start) && !!previousLine) {  // at start of line already and there is a previousLine
        return { queryIndex: document.offsetAt(previousLine.range.start) };
      }
      else if (cursorPosition.isAfter(currentLineRange.start))        // not at start of currentLine
        return { queryIndex: document.offsetAt(currentLineRange.start) };
    }
  }

  else if (query === '^$') {  // previous empty line

    const queryLength = document.eol === EndOfLine.CRLF ? 2 : 1; // correct for Windows CRLF / Mac-Linux LF

    const matches = [...startText.matchAll(/(?<=\r?\n)\r?\n/g)];

    if (!matches.length) {
      if (startText.startsWith('\r\n')) return { queryIndex: 0 };
      else if (startText.startsWith('\n')) return { queryIndex: 0 };
      else return { queryIndex };
    }

    const lastIndex = matches?.at(-1)?.index ?? -1;
    const penultimateIndex = matches?.at(-2)?.index ?? -1;

    // if putCursorBackward = afterCharacter, add match.length (\r\n or \n) to lastIndex
    if (putCursorBackward === "afterCharacter") {
      // going backward and cursor at last match, skip and go to the penultimate match
      if ((penultimateIndex !== -1) && (lastIndex !== -1) && (cursorIndex === lastIndex + queryLength)) {
        queryIndex = penultimateIndex;
      }
      else if ((lastIndex !== -1) && (cursorIndex === lastIndex + queryLength)) {
        queryIndex = 0;
      }
      else if (lastIndex !== -1) {
        queryIndex = lastIndex;
      }
    }
    else queryIndex = lastIndex;

    return { queryIndex };
  }

  query = unescapeQuery(query);

  if (startText) {  // startText = '' if already at the start of the document

    let matchPos;

    if (putCursorBackward === 'afterCharacter') {
      const end = startText.length - query.length;
      matchPos = startText.substring(0, end).lastIndexOf(query);
    }
    else matchPos = startText.lastIndexOf(query);  // is case-sensitive

    if (matchPos !== -1) {
      queryIndex = matchPos;
    }
  }

  return { queryIndex };
}
