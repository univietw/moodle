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

const fetchOne = (methodname, args) => call([{
    methodname,
    args,
}])[0];

async function sha1(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Example usage:



export const register = (editor) => {
        // Attempt to store the draft one final time before the page unloads.
    // Note: This may need to be sent as a beacon instead.
   // document.addEventListener('visibilitychange', visibilityChangedHandler);

    // When the page is submitted as a form, remove the draft.
   // editor.on('submit', removeAutoSaveSession);
   // document.addEventListener(eventTypes.formSubmittedByJavascript, handleFormSubmittedByJavascript);
    const c = window.console;
    editor.on('init', () => {
        setInterval(() => {
            const newContent = editor.getContent();
            sha1(newContent).then(hash => {
                newHash = hash;
                if (currentHash === '') {
                    currentHash = newHash;
                }
                if (newHash !== currentHash) {
                    const patch = jsDiff.createPatch('a', currentContent, newContent);

                    c.log('contextid', Options.getContextId(editor));
                    c.log('pagehash', Options.getPageHash(editor));
                    c.log('pageinstance', Options.getPageInstance(editor));
                    c.log('elementid', editor.targetElm.id);
                    c.log('oldcontenthash', currentHash);
                    c.log('newcontenthash', newHash);
                    c.log('changes', patch);
                    return fetchOne('tiny_collaborate_save_changes', {
                        contextid: Options.getContextId(editor),
                        pagehash: Options.getPageHash(editor),
                        pageinstance: Options.getPageInstance(editor),
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
