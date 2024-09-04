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
    editor.selection.collapse();
    editor.selection.setContent(COLCURPLACEHOLDER);
    const contentWithMarker = editor.getContent();
    removePlaceholderAtCursor(editor);
    return contentWithMarker;
  /*  const textNode = editor.selection.getNode();
    const rng = editor.selection.getRng();
    const placeholderIndex = textNode.textContent.indexOf(COLCURPLACEHOLDER);
    console.log('currentStartContainer', placeholderIndex);
    rng.setStart(textNode, placeholderIndex-1);
    rng.setEnd(textNode, placeholderIndex);*/

    //editor.selection.setRng(rng);
    //rng.deleteContents();
   //const markerElement = editor.getBody().querySelector(COLCURID);
    //editor.dom.remove(markerElement); // Clean up marker
   // return contentWithMarker;
};

const restoreCursorPositionFromMarker = (editor, oldContentWithMarker) => {
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

            editor.focus();  // Ensure the editor is focused after moving the cursor
            break;  // Once found, exit the loop as it's a unique character
        }
    }

    if (!found) {
        console.log('Placeholder not found.');
    }
}

const removePlaceholderAtCursor2 = (editor) => {
    const selection = editor.selection;
    const range = selection.getRng();  // Get the current range (cursor position)
    let newRange = null;
    // Check if we're in a text node and if it contains the placeholder character
    if (range.startContainer.nodeType === 3) {  // 3 means it's a text node
        const textNode = range.startContainer;
        const text = textNode.textContent;
        const placeholderIndex = text.indexOf(COLCURPLACEHOLDER);

        if (placeholderIndex !== -1) {
            // Create a new range to delete just the placeholder character
            newRange = editor.dom.createRng();
            newRange.setStart(textNode, placeholderIndex);
            newRange.setEnd(textNode, placeholderIndex + 1);  // Select the placeholder character

            // Delete the placeholder character
            newRange.deleteContents();
        }
    } else if (range.startContainer.nodeType === 1) {
        const element = range.startContainer;

        // Iterate over child nodes to find and remove the placeholder in text nodes
        for (let i = 0; i < element.childNodes.length; i++) {
            const child = element.childNodes[i];

            if (child.nodeType === 3) {  // If it's a text node
                const text = child.textContent;
                const placeholderIndex = text.indexOf(COLCURPLACEHOLDER);

                if (placeholderIndex !== -1) {
                    // Create a new range to delete the placeholder character
                    newRange = editor.dom.createRng();
                    newRange.setStart(child, placeholderIndex);
                    newRange.setEnd(child, placeholderIndex + 1);  // Select the placeholder character

                    // Delete the placeholder character
                    newRange.deleteContents();
                    break;  // Once found and deleted, we can stop
                }
            }
        }
    }
    if (newRange !== null) {
        editor.selection.setRng(newRange);  // Set the new range to update the cursor position
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
                    /* c.log('contextid', Options.getContextId(editor));
                     c.log('pagehash', Options.getPageHash(editor));
                     c.log('pageinstance', Options.getPageInstance(editor));
                     c.log('elementid', editor.targetElm.id);
                     c.log('oldcontenthash', currentHash);
                     c.log('newcontenthash', newHash);
                     c.log('changes', patch);*/
                    return fetchOne('tiny_collaborate_save_changes', {
                        contextid: Options.getContextId(editor),
                        pagehash: Options.getPageHash(editor),
                        //pageinstance: Options.getPageInstance(editor),
                        elementid: editor.targetElm.id,
                        /*drftid: Options.getDraftItemId(editor),*/
                        oldcontenthash: currentHash,
                        newcontenthash: newHash,
                        changes: patch,

                    })
                        .then((result) => {
                            //* pendingPromise.resolve();
                            // c.log('new hash', newHash);
                            //  c.log('diff', patch);
                            currentContent = newContent;
                            currentHash = newHash;
                            return result;
                        });
                }
            });
            if (currentHash === '') {
                return;
            }
            let newContent2 = editor.getContent();
            const oldContentWithoutMarker = insertCursorMarker(editor);
            let changesMade = false;
            fetchOne('tiny_collaborate_get_changes', {
                contextid: Options.getContextId(editor),
                pagehash: Options.getPageHash(editor),
                //   pageinstance: Options.getPageInstance(editor),
                elementid: editor.targetElm.id,
                currenthash: currentHash,
            }).then((result) => {
                if (result) {
                    for (let i in result) {
                        let change = result[i];
                        //  c.log('shorthcange', change);
                        let patch = HEADER + change;
                        //  c.log('changes', patch);
                        //   c.log('parsedPatch', jsDiff.parsePatch(patch));
                        newContent2 = jsDiff.applyPatch(newContent2, patch);
                        changesMade = true;
                    }
                    if (changesMade) {
                        if (newContent2 === false) {
                            c.log('Patch FAILED');
                        } else {
                            //        c.log('newContent2', newContent2);
                            editor.setContent(newContent2);
                            currentContent = newContent2;
                            sha1(newContent2).then(hash => {
                                currentHash = hash;
                                //             c.log('new hash', currentHash);
                            });
                            c.log('Applied patch successfully!');
                        }
                    }
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
