// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Storage helper for the Moodle Tiny Autosave plugin.
 *
 * @module      tiny_autosave/autosaver
 * @copyright   2022 Andrew Lyons <andrew@nicols.co.uk>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

//import * as Options from './options';
//import * as Storage from './storage';mm
//import Log from 'core/log';
//import {eventTypes} from 'core_form/events';
//import {getLogSource} from './common';
import * as jsDiff from './jsdiff/index';
import {call} from 'core/ajax';
import * as Options from "./options";


let currentContent = '';
let currentHash = '';
let newHash = '';
//let newContent = '';
//let lastHash = '';
const INTERVALTIMEOUT = 1000;
const HEADER = "Index: a\n===================================================================\n";
const COLCURSPAN = '<span id="COLCUR"></span>';
const COLCURID = '#COLCUR';
const COLCURPLACEHOLDER = String.fromCharCode(254);

const fetchOne = (methodname, args) => call([{
    methodname,
    args,
}])[0];
let intervalId = null;

async function sha1(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

const c = window.console;
// Example usage:
const insertCursorMarker = (editor) => {

    const currentFocusedElement = document.activeElement;
    const isEditorFocused = (currentFocusedElement === editor.getBody());
    if (!isEditorFocused) {
        return null;
    }
    editor.selection.collapse();
    editor.selection.setContent(COLCURPLACEHOLDER);
    const contentWithMarker = editor.getContent();
    removePlaceholderAtCursor(editor);
    return contentWithMarker;
};

const restoreCursorPositionFromMarker = (editor, oldContentWithMarker) => {
    if (oldContentWithMarker === null) {
        return;
    }
    const currentContentWithoutMarker = editor.getContent();
    let changes = jsDiff.diffChars(oldContentWithMarker, currentContentWithoutMarker);
    c.log('new patch for cursor', changes);
    let currentContentWithMarker = '';
    changes.forEach((part) => {
        // green for additions, red for deletions
        // grey for common parts
        if (!part.removed || part.value === COLCURPLACEHOLDER) {
            currentContentWithMarker += part.value;
        }
    });

    editor.setContent(currentContentWithMarker);
    removePlaceholderAtCursor(editor);
    //const markerElement = editor.getBody().querySelector(COLCURID);
    /*const placeholderIndex = currentContentWithMarker.indexOf(COLCURPLACEHOLDER);
    if (!placeholderIndex) {
        c.log('no marker found');
        return;
    }

    const range = editor.dom.createRng();
    const textNode = editor.getBody().firstChild;
    range.setStart(textNode, placeholderIndex);
    range.setEnd(textNode, placeholderIndex + 1);
    editor.selection.setRng(range);
    range.deleteContents();*/

    /*range.setStartAfter(markerElement);
    range.collapse(true);
    editor.selection.setRng(range);
    editor.dom.remove(markerElement); // Clean up marker*/

};

const removePlaceholderAtCursor = (editor) => {
    const body = editor.getBody();  // Get the body of the TinyMCE editor
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null, false);  // Traverse through text nodes

    let found = false;
    const currentFocusedElement = document.activeElement;
    const isEditorFocused = (currentFocusedElement === editor.getBody());
    while (walker.nextNode()) {
        const textNode = walker.currentNode;
        const textContent = textNode.textContent;
        const placeholderIndex = textContent.indexOf(COLCURPLACEHOLDER);

        // If the placeholder is found in this text node
        if (placeholderIndex !== -1) {
            found = true;

            // Remove the placeholder character from the text node
            const updatedText = textContent.slice(0, placeholderIndex) + textContent.slice(placeholderIndex + 1);
            textNode.textContent = updatedText;

            // Create a new range and set the cursor position to where the placeholder was
            const range = editor.dom.createRng();
            range.setStart(textNode, placeholderIndex);
            range.collapse(true);  // Collapse the range to make it a cursor position
            editor.selection.setRng(range);  // Set the new range as the selection

           // editor.focus();  // Ensure the editor is focused after moving the cursor
            break;  // Once found, exit the loop as it's a unique character
        }
    }

    if (!found) {
        console.log('Placeholder not found.');
    }
    if (currentFocusedElement && !isEditorFocused) {
        currentFocusedElement.focus();
    }
}


export const register = (editor) => {
    // Attempt to store the draft one final time before the page unloads.
    // Note: This may need to be sent as a beacon instead.
    // document.addEventListener('visibilitychange', visibilityChangedHandler);

    // When the page is submitted as a form, remove the draft.
    // editor.on('submit', removeAutoSaveSession);
    // document.addEventListener(eventTypes.formSubmittedByJavascript, handleFormSubmittedByJavascript);
    editor.on('init', () => {
        let statusBarElement = document.createElement("p");
        const txt = document.createTextNode("Collaboratiny initialized.");
        statusBarElement.appendChild(txt);

        editor
            .getElement()
            .nextElementSibling
            .getElementsByClassName("tox-statusbar__right-container")[0]
            .prepend(statusBarElement);

        let lastChangeId = 0;

        setInterval(() => {
            const newContent = editor.getContent();
            sha1(newContent).then(hash => {
                newHash = hash;
                if (currentHash === '') {
                    currentContent = newContent;
                    currentHash = newHash;
                    return;
                }
                if (newHash !== currentHash) {
                    let patch = jsDiff.createPatch('a', currentContent, newContent);
                    patch = patch.substring(HEADER.length);
                    return fetchOne('tiny_collaborate_save_changes', {
                        contextid: Options.getContextId(editor),
                        elementid: editor.targetElm.id,
                        oldcontenthash: currentHash,
                        newcontenthash: newHash,
                        changes: patch,
                        oldid: lastChangeId,
                    })
                    .then((result) => {
                        if (result === -1) {
                            // TODO: get changes.
                        } else {
                            currentContent = newContent;
                            currentHash = newHash;
                            lastChangeId = result;
                        }

                    });
                }
            });
            if (currentHash === '') {
                return;
            }

            fetchOne('tiny_collaborate_set_position', {
                contextid: Options.getContextId(editor),
                elementid: editor.targetElm.id,
                pageinstance: Options.getPageInstance(editor),
                position: "<empty>",
            }).then((result) => {
                c.log("RESULT: " + result);
            }).fail((err) => {
                c.error(err);
            });

            let newContent2 = editor.getContent();
            const oldContentWithoutMarker = insertCursorMarker(editor);
            let changesMade = false;
            fetchOne('tiny_collaborate_get_changes', {
                contextid: Options.getContextId(editor),
                elementid: editor.targetElm.id,
                currenthash: currentHash,
                oldid: lastChangeId,
            }).then((result) => {
                if (result) {
                    const changes = result.changes;
                    for (const change of changes) {
                        let patch = HEADER + change.change;
                        lastChangeId = change.id;
                        newContent2 = jsDiff.applyPatch(newContent2, patch);
                        changesMade = true;
                    }
                    if (changesMade) {
                        if (newContent2 === false) {
                            c.log('Patch FAILED');
                        } else {
                            editor.setContent(newContent2);
                            currentContent = newContent2;
                            sha1(newContent2).then(hash => {
                                currentHash = hash;
                            });
                            c.log('Applied patch successfully!');
                        }
                    }
                    let s = result.positions.length === 1 ? '' : 's';
                    statusBarElement.innerText = `${result.positions.length} collaborator${s}`;

                    //clearInterval(intervalId);
                }
                if (changesMade) {
                    restoreCursorPositionFromMarker(editor, oldContentWithoutMarker);
                }
            });

        }, INTERVALTIMEOUT);

        /*editor.on('Change', (event) => {
            c.log('Change collaborative', event);
        });*/
        // Setup the Undo handler.
        //editor.on('AddUndo', undoHandler);

        /* if (editor.dom.isEmpty(editor.getBody())) {
             Log.info(`Attempting to restore draft`, getLogSource(editor));
             Storage.restoreDraft(editor);
         } else {
             // There was nothing to restore, so we can mark the editor as initialised.
             Log.warn(`Skipping draft restoration. The editor is not empty.`, getLogSource(editor));
             Options.markInitialised(editor);
         }*/
    });
};
