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

/**
 *
 *
 * @package   tiny_collaborative
 * @category  external
 * @copyright 2024 Thomas Wedekind <Thomas.Wedekind@univie.ac.at>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class save_changes extends external_api {
    /**
     * Returns description of method parameters
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'contextid' => new external_value(PARAM_INT, 'The context id that owns the editor', VALUE_REQUIRED),
            'elementid' => new external_value(PARAM_RAW, 'The ID of the element', VALUE_REQUIRED),
            'oldcontenthash' => new external_value(PARAM_ALPHANUMEXT, 'The hash of the old status', VALUE_REQUIRED),
            'newcontenthash' => new external_value(PARAM_ALPHANUMEXT, 'The hash of the new status', VALUE_REQUIRED),
            'changes' => new external_value(PARAM_RAW, 'The changes done between old and new hash', VALUE_REQUIRED),
            'oldid' => new external_value(PARAM_INT, 'The old changesid the user is referring to', VALUE_OPTIONAL, 0),
        ]);
    }

    /**
     * 
     * @param int $contextid The context id of the owner
     * @param string $pageinstance The instance id of the page
     * @param string $elementid The id of the element
     * @param string $drafttext The text to store
     * @return int
     */
    public static function execute(
        int $contextid,
        string $elementid,
        string $oldcontenthash,
        string $newcontenthash,
        string $changes,
        int $oldid
    ): int {

        [
            'contextid' => $contextid,
            'elementid' => $elementid,
            'oldcontenthash' => $oldcontenthash,
            'newcontenthash' => $newcontenthash,
            'changes' => $changes,
            'oldid' => $oldid
        ] = self::validate_parameters(self::execute_parameters(), [
            'contextid' => $contextid,
            'elementid' => $elementid,
            'oldcontenthash' => $oldcontenthash,
            'newcontenthash' => $newcontenthash,
            'changes' => $changes,
            'oldid' => $oldid
        ]);
        // May have been called by a non-logged in user.
        if (isloggedin() && !isguestuser()) {
            $manager = new \tiny_collaborative\change_manager($contextid, $elementid, $oldcontenthash);
            $id = $manager->add_collaborative_record($oldid, $newcontenthash, $changes);
        }

        return $id;
    }

    /**
     * Describe the return structure of the external service.
     *
     * @return external_value
     */
    public static function execute_returns(): external_value {
        return new external_value(PARAM_INT, 'The new id of your entry');
    }
}
