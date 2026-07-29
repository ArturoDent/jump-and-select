const { commands, window, Range, Position, Selection, EndOfLine, TextEditorRevealType } = require('vscode');
const statusBarItem = require('./statusBar');

/**
 * The Object returned contains the index of the matched query or -1.
 * This index is from the beginning of the text to be searched.
 *
 * @typedef  { Object } QueryObject
 * @property { Number } queryIndex  - index of query character in line or document from cursor
 * @property { Number } [matchLength] - length of the actual match; only set by regex searches, where it can't be derived from the pattern string
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

/**
 * Resolve the '${selectedText}' template in a query to the given selection's
 * own selected text (each selection may have different selected text).
 *
 * @param { string } query
 * @param { import("vscode").TextEditor } editor
 * @param { Selection } selection
 * @returns { string }
 */
function resolveSelectedText(query, editor, selection) {
  if (!query.includes('${selectedText}')) return query;
  return query.replaceAll('${selectedText}', editor.document.getText(selection));
}

/**
 * Find the first regex match in `text`, skipping a match sitting at index 0
 * when putCursorForward is 'beforeCharacter' (the cursor is already right
 * before it, so a repeated jump should keep advancing rather than no-op).
 *
 * @param { string } text
 * @param { string } pattern
 * @param { string } putCursorForward
 * @returns { RegExpMatchArray | null }
 */
function regexMatchForward(text, pattern, putCursorForward) {
  let re;
  try { re = new RegExp(pattern, 'mg'); } catch { return null; }
  const matches = [...text.matchAll(re)];
  return (putCursorForward === 'beforeCharacter'
    ? matches.find(m => m.index > 0)
    : matches[0]) ?? null;
}

/**
 * Find the last regex match in `text`, skipping a match ending exactly at
 * the end of `text` when putCursorBackward is 'afterCharacter' (the cursor
 * is already right after it, so a repeated jump should keep advancing).
 *
 * @param { string } text
 * @param { string } pattern
 * @param { string } putCursorBackward
 * @returns { RegExpMatchArray | null }
 */
function regexMatchBackward(text, pattern, putCursorBackward) {
  let re;
  try { re = new RegExp(pattern, 'mg'); } catch { return null; }
  const matches = [...text.matchAll(re)];
  return (putCursorBackward === 'afterCharacter'
    ? matches.findLast(m => m.index + m[0].length < text.length)
    : matches.at(-1)) ?? null;
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
 * @param { boolean } [isRegex] - treat query as a regular expression?
 * @param { boolean } [selectMatch] - when selecting, select only the matched text instead of extending from the current position
 */
async function typeRegisterAndRunJumps(restrictSearch, putCursor, multiMode, select, runJump, isRegex, selectMatch) {

  globalThis.typeDisposable = commands.registerCommand('type', async arg => {

    // a tab is not considered a character for some reason, spaces are though
    if (arg.text === '\n') {       // escape doesn't produce an arg
      await statusBarItem.hide();
      await globalThis.typeDisposable?.dispose();
      return;
    }

    await runJump(restrictSearch, putCursor, arg.text, select, isRegex, selectMatch);
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
 * @param { boolean } [isRegex] - treat kbText as a regular expression?
 * @param { boolean } [selectMatch] - when selecting, select only the matched text instead of extending from the current position
 */
exports.jumpForward = async function (restrictSearch, putCursor, kbText, multiMode, select, isRegex, selectMatch) {

  if (multiMode && !globalThis.statusBarItemVisible) await statusBarItem.show("forward");

  // kbText = triggered via a keybinding with a text arg
  if (kbText) {
    await _jumpForward(restrictSearch, putCursor, kbText, select, isRegex, selectMatch);
    if (!multiMode) return;
  }

  await typeRegisterAndRunJumps(restrictSearch, putCursor, multiMode, select, _jumpForward, isRegex, selectMatch);
};


/**
 * Move cursor backward to previous chosen character, without selection
 * @param { string } restrictSearch - search backward in current line or document
 * @param { string } putCursor - move cursor before/after character typed
 * @param { string } kbText - keybinding text, if any or empty string
 * @param { boolean } multiMode - in MultiMode?
 * @param { boolean } select - in select?
 * @param { boolean } [isRegex] - treat kbText as a regular expression?
 * @param { boolean } [selectMatch] - when selecting, select only the matched text instead of extending from the current position
 */
exports.jumpBackward = async function (restrictSearch, putCursor, kbText, multiMode, select, isRegex, selectMatch) {

  if (multiMode && !globalThis.statusBarItemVisible) await statusBarItem.show("backward");

  // kbText = triggered via a keybinding with a text arg
  if (kbText) {
    await _jumpBackward(restrictSearch, putCursor, kbText, select, isRegex, selectMatch);
    if (!multiMode) return;
  }

  await typeRegisterAndRunJumps(restrictSearch, putCursor, multiMode, select, _jumpBackward, isRegex, selectMatch);
};


/**
 * Move cursor forward to next chosen character, without selection, and reveal if necessary
 * @param { string } restrictSearch
 * @param { string } putCursorForward
 * @param { string } query - keybinding arg or next character typed
 * @param { boolean } select
 * @param { boolean } [isRegex] - treat query (after ${selectedText} resolution) as a regular expression?
 * @param { boolean } [selectMatch] - when selecting, select only the matched text instead of extending from the current position
 */
async function _jumpForward(restrictSearch, putCursorForward, query, select, isRegex, selectMatch) {

  if (!window.activeTextEditor) return;

  const editor = window.activeTextEditor;

  const newSelections = [...editor.selections];

  newSelections.forEach((selection, index) => {

    const curPos = selection.active;  // cursor Position
    let curAnchor = selection.anchor; // start of selection - not where the cursor is
    const cursorIndex = editor.document.offsetAt(curPos);

    const resolvedQuery = resolveSelectedText(query, editor, selection);

    const queryObject = restrictSearch === "line"
      ? getQueryLineIndexForward(curPos, resolvedQuery, putCursorForward, selection, isRegex)
      : getQueryDocumentIndexForward(curPos, resolvedQuery, putCursorForward, selection, isRegex);

    if (queryObject.queryIndex === -1) return;

    const matchLength = isRegex ? (queryObject.matchLength ?? 0) : getMatchLength(resolvedQuery, editor);

    const matchStartOffset = queryObject.queryIndex + cursorIndex;
    const matchEndOffset = matchStartOffset + matchLength;

    // effective default = "beforeCharacter"
    const queryPos = putCursorForward === "afterCharacter"
      ? editor.document.positionAt(matchEndOffset)
      : editor.document.positionAt(matchStartOffset);

    if (select && selectMatch) {
      curAnchor = putCursorForward === "afterCharacter"
        ? editor.document.positionAt(matchStartOffset)
        : editor.document.positionAt(matchEndOffset);
    }
    // if selection.anchor > selection.active, swap them = selection.isReversed = true
    else if (select && selection.isReversed) curAnchor = selection.active;

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
 * @param { boolean } [isRegex] - treat query (after ${selectedText} resolution) as a regular expression?
 * @param { boolean } [selectMatch] - when selecting, select only the matched text instead of extending from the current position
 */
async function _jumpBackward(restrictSearch, putCursorBackward, query, select, isRegex, selectMatch) {

  if (!window.activeTextEditor) return;

  const editor = window.activeTextEditor;

  const newSelections = [...editor.selections];

  newSelections.forEach((selection, index) => {

    const curPos = selection.active;
    let curAnchor = selection.anchor; // start of selection - not where the cursor is

    const resolvedQuery = resolveSelectedText(query, editor, selection);

    const queryObject = restrictSearch === "line"
      ? getQueryLineIndexBackward(curPos, resolvedQuery, putCursorBackward, selection, isRegex)
      : getQueryDocumentIndexBackward(curPos, resolvedQuery, putCursorBackward, selection, isRegex);

    if (queryObject.queryIndex === -1) return;

    const matchLength = isRegex ? (queryObject.matchLength ?? 0) : getMatchLength(resolvedQuery, editor);

    const matchStartIndex = queryObject.queryIndex;
    const matchEndIndex = matchStartIndex + matchLength;

    const positionFor = (/** @type { number } */ idx) => restrictSearch === "line"
      ? new Position(curPos.line, idx)
      : editor.document.positionAt(idx);

    // effective default = "beforeCharacter"
    const queryPos = putCursorBackward === "afterCharacter"
      ? positionFor(matchEndIndex)
      : positionFor(matchStartIndex);

    if (select && selectMatch) {
      curAnchor = putCursorBackward === "afterCharacter"
        ? positionFor(matchStartIndex)
        : positionFor(matchEndIndex);
    }
    // if selection.anchor < selection.active, swap them = selection.isReversed = false
    else if (select && !selection.isReversed) curAnchor = selection.active;

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
 * @param { boolean } [isRegex] - treat query as a regular expression?
 *
 * @returns { QueryObject }
 */
function getQueryLineIndexForward(cursorPosition, query, putCursorForward, selection, isRegex) {

  const document = window.activeTextEditor?.document;

  let queryIndex = -1;  // the match point as an index of the line
  let restOfLine = '';

  if (!document) return noMatchQueryObject;

  const line = document.lineAt(cursorPosition.line);
  const lineRange = line.range;

  if (selection.isReversed) restOfLine = line.text.substring(selection.anchor.character);
  else restOfLine = line.text.substring(cursorPosition.character);

  if (isRegex) {
    if (!restOfLine) return noMatchQueryObject;

    const match = regexMatchForward(restOfLine, query, putCursorForward);
    if (!match) return noMatchQueryObject;
    const matchPos = match.index ?? 0;

    if (selection.isReversed) queryIndex = document.offsetAt(selection.end) - document.offsetAt(selection.start) + matchPos;
    else queryIndex = matchPos;

    return { queryIndex, matchLength: match[0].length };
  }

  if (query === '$') {
    return { queryIndex: lineRange.end.character - cursorPosition.character };
  }

  query = unescapeQuery(query);

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
 * @param { boolean } [isRegex] - treat query as a regular expression?
 *
 * @returns { QueryObject }
 */
function getQueryDocumentIndexForward(cursorPosition, query, putCursorForward, selection, isRegex) {

  const document = window.activeTextEditor?.document;

  let queryIndex = -1;
  let restOfText = '';

  if (!document) return noMatchQueryObject;

  let cursorIndex = document?.offsetAt(cursorPosition);

  if (isRegex) {
    const lastLine = document.lineAt(document.lineCount - 1);
    const curEndRange = selection.isReversed
      ? new Range(selection.anchor, lastLine.range.end)
      : new Range(cursorPosition, lastLine.range.end);
    const text = document.getText(curEndRange);
    if (!text) return noMatchQueryObject;

    const match = regexMatchForward(text, query, putCursorForward);
    if (!match) return noMatchQueryObject;
    const matchPos = match.index ?? 0;

    if (selection.isReversed) queryIndex = document.offsetAt(selection.end) - document.offsetAt(selection.start) + matchPos;
    else queryIndex = matchPos;

    return { queryIndex, matchLength: match[0].length };
  }

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
 * @param { boolean } [isRegex] - treat query as a regular expression?
 *
 * @returns { QueryObject }
 */
function getQueryLineIndexBackward(cursorPosition, query, putCursorBackward, selection, isRegex) {

  const document = window.activeTextEditor?.document;

  let queryIndex = -1;
  let startOfLine = '';

  if (!document) return noMatchQueryObject;

  const line = document.lineAt(cursorPosition.line);
  if (!selection.isReversed) startOfLine = line.text.substring(0, selection.anchor.character);
  else startOfLine = line.text.substring(0, cursorPosition.character);  // same as selection.active.character

  if (isRegex) {
    if (!startOfLine) return noMatchQueryObject;

    const match = regexMatchBackward(startOfLine, query, putCursorBackward);
    if (!match) return noMatchQueryObject;

    return { queryIndex: match.index ?? 0, matchLength: match[0].length };
  }

  if (query === '^') return { queryIndex: 0 };

  query = unescapeQuery(query);

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
 * @param { boolean } [isRegex] - treat query as a regular expression?
 *
 * @returns { QueryObject }
 */
function getQueryDocumentIndexBackward(cursorPosition, query, putCursorBackward, selection, isRegex) {

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

  if (isRegex) {
    if (!startText) return noMatchQueryObject;

    const match = regexMatchBackward(startText, query, putCursorBackward);
    if (!match) return noMatchQueryObject;

    return { queryIndex: match.index ?? 0, matchLength: match[0].length };
  }

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
