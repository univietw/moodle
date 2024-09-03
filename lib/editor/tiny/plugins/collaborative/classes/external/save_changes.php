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
            'pagehash' => new external_value(PARAM_ALPHANUMEXT, 'The page hash', VALUE_REQUIRED),
            'pageinstance' => new external_value(PARAM_ALPHANUMEXT, 'The page instance', VALUE_REQUIRED),
            'elementid' => new external_value(PARAM_RAW, 'The ID of the element', VALUE_REQUIRED),
            'oldcontenthash' => new external_value(PARAM_ALPHANUMEXT, 'The hash of the old status', VALUE_REQUIRED),
            'newcontenthash' => new external_value(PARAM_ALPHANUMEXT, 'The hash of the new status', VALUE_REQUIRED),
            'changes' => new external_value(PARAM_RAW, 'The changes done between old and new hash', VALUE_REQUIRED),
        ]);
    }

    /**
     * 
     * @param int $contextid The context id of the owner
     * @param string $pagehash The hash of the page
     * @param string $pageinstance The instance id of the page
     * @param string $elementid The id of the element
     * @param string $drafttext The text to store
     * @return null
     */
    public static function execute(
        int $contextid,
        string $pagehash,
        string $pageinstance,
        string $elementid,
        string $oldcontenthash,
        string $newcontenthash,
        string $changes
    ): array {

        [
            'contextid' => $contextid,
            'pagehash' => $pagehash,
            'pageinstance' => $pageinstance,
            'elementid' => $elementid,
            'oldcontenthash' => $oldcontenthash,
            'newcontenthash' => $newcontenthash,
            'changes' => $changes
        ] = self::validate_parameters(self::execute_parameters(), [
            'contextid' => $contextid,
            'pagehash' => $pagehash,
            'pageinstance' => $pageinstance,
            'elementid' => $elementid,
            'oldcontenthash' => $oldcontenthash,
            'newcontenthash' => $newcontenthash,
            'changes' => $changes
        ]);

        // May have been called by a non-logged in user.
        if (isloggedin() && !isguestuser()) {
            $manager = new \tiny_collaborative\change_manager($contextid, $pagehash, $pageinstance, $elementid, $oldcontenthash);
            $manager->add_collaborative_record($newcontenthash, $changes);
        }

        return [];
    }

    /**
     * Describe the return structure of the external service.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([]);
    }
}
