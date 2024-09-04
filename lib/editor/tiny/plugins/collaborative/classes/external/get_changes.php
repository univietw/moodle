<?php
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

namespace tiny_collaborative\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;
use core_external\external_multiple_structure;
use tiny_collaborative;

/**
 * Web Service to resume an autosave session.
 *
 * @package   tiny_autosave
 * @category  external
 * @copyright 2022 Andrew Lyons <andrew@nicols.co.uk>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class get_changes extends external_api {
    /**
     * Returns description of method parameters
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'contextid' => new external_value(PARAM_INT, 'The context id that owns the editor', VALUE_REQUIRED),
            'elementid' => new external_value(PARAM_RAW, 'The ID of the element', VALUE_REQUIRED),
            'currenthash' => new external_value(PARAM_ALPHANUMEXT, 'The ID of the element', VALUE_REQUIRED),
            'oldid' => new external_value(PARAM_INT, 'The ID of the element', VALUE_OPTIONAL),
        ]);
    }

    /**
     * Reset the autosave entry for this autosave instance.
     *
     * If not matching autosave area could be found, the function will
     * silently return and this is not treated as an error condition.
     *
     * @param int $contextid The context id of the owner
     * @param string $pageinstance The instance id of the page
     * @param string $elementid The id of the element
     * @param int $draftid The id of the draftid to resume to
     * @return null
     */
    public static function execute(
        int $contextid,
       string $elementid,
        string $currenthash,
        string $oldid
    ): array {

        [
            'contextid' => $contextid,
            'elementid' => $elementid,
            'currenthash' => $currenthash,
            'oldid' => $oldid
        ] = self::validate_parameters(self::execute_parameters(), [
            'contextid' => $contextid,
            'elementid' => $elementid,
            'currenthash' => $currenthash,
            'oldid' => $oldid
        ]);


        // May have been called by a non-logged in user.
        if (isloggedin() && !isguestuser()) {
            $manager = new \tiny_collaborative\change_manager($contextid, $elementid, $currenthash);
            $changes = $manager->get_changes($oldid);
            $positionmanager = new tiny_collaborative\position_manager($contextid, $elementid);
            $positions = $positionmanager->get_user_positions();
        }
        return ['changes' => $changes, 'positions' => $positions];
    }

    /**
     * Describe the return structure of the external service.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure( 

            ['changes' => new external_multiple_structure( 
                           new external_single_structure([
                               'id' => new external_value(PARAM_INT, 'Database ID of the change'),
                               'change' => new external_value(PARAM_RAW, 'Description of the change'),
                               'newcontenthash' => new external_value(PARAM_RAW, 'hash after the change')
                           ])),
             'positions' => new external_multiple_structure(
                new external_single_structure([
                    'userid' => new external_value(PARAM_INT, 'UserID'),
                    'position' => new external_value(PARAM_RAW, 'Position'),
                ])
             )]
        );
    }
}
