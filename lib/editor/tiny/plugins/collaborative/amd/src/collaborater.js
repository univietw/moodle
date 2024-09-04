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

// Example usage:
const insertCursorMarker = (editor) => {
    const markerId = 'cursor-marker-' + new Date().getTime();
    editor.selection.collapse();
    editor.selection.setContent(`<span id="${markerId}"></span>`);
    return markerId;
};
const restoreCursorPositionFromMarker = (editor, markerId) => {
    const markerElement = editor.getBody().querySelector(`#${markerId}`);
    if (markerElement) {
        const range = editor.dom.createRng();
        range.setStartAfter(markerElement);
        range.collapse(true);
        editor.selection.setRng(range);
        editor.dom.remove(markerElement); // Clean up marker
       // editor.focus();
    } else {
        // Fallback if marker not found
       // editor.focus();
        editor.selection.select(editor.getBody(), true);
        editor.selection.collapse(false);
    }
};


export const register = (editor) => {
        // Attempt to store the draft one final time before the page unloads.
    // Note: This may need to be sent as a beacon instead.
   // document.addEventListener('visibilitychange', visibilityChangedHandler);

    // When the page is submitted as a form, remove the draft.
   // editor.on('submit', removeAutoSaveSession);
   // document.addEventListener(eventTypes.formSubmittedByJavascript, handleFormSubmittedByJavascript);
    const c = window.console;
    editor.on('init', () => {
        let status_bar_element = document.createElement("p");
        const txt = document.createTextNode("Collaboratiny initialized.");
        status_bar_element.appendChild(txt);

        editor
            .getElement()
            .nextElementSibling
            .getElementsByClassName("tox-statusbar__right-container")[0]
            .prepend(status_bar_element);

        let x = 0;
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
            fetchOne('tiny_collaborate_get_changes', {
                contextid: Options.getContextId(editor),
                elementid: editor.targetElm.id,
                currenthash: currentHash,
            }).then((result) => {
                status_bar_element.innerText = "Counter " + x++;
                c.log(status_bar_element);
                if (result) {
                    let changesMade = false;
                    const changes = result.changes;
                    for (let change in changes) {
                        c.log('shorthcange', change);
                        let patch = HEADER + change;
                        c.log('changes', patch);
                        c.log('parsedPatch', jsDiff.parsePatch(patch));
                        newContent2 = jsDiff.applyPatch(newContent2, patch);
                        changesMade = true;
                    }
                    if (changesMade) {
                        if (newContent2 === false) {
                            c.log('Patch FAILED');
                        } else {
                            c.log('newContent2', newContent2);
                            editor.setContent(newContent2);
                            currentContent = newContent2;
                            sha1(newContent2).then(hash => {
                                currentHash = hash;
                                c.log('new hash', currentHash);
                            });
                        }
                    }
                    //clearInterval(intervalId);
                }

             //   restoreCursorPositionFromMarker(editor, markerId);
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
