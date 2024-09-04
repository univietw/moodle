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

namespace tiny_collaborative;

use stdClass;

/**
 * Autosave Manager.
 *
 * @package   tiny_autosave
 * @copyright 2022 Andrew Lyons <andrew@nicols.co.uk>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class position_manager {

    /** @var int The contextid */
    protected $contextid;
    
    /** @var string The page hash reference */
    protected $pagehash;

    /** @var string The elementid for this editor */
    protected $elementid;

    /**
     * Constructor for the autosave manager.
     *
     * @param int $contextid The contextid of the session
     * @param string $pageinstance The page instance
     * @param string $elementid The element id
     * @param null|stdClass $user The user object for the owner of the autosave
     */
    public function __construct(
        int $contextid,
        string $elementid
        ) {
            $this->contextid = $contextid;
            $this->elementid = $elementid;
    }
    
    public function set_position($pageinstance, $position) {
        global $DB,$USER;
        
        $record = $DB->get_record('tiny_collaborative_positions',[
            'contextid' => $this->contextid,
            'elementid' => $this->elementid,
            'pageinstance' => $pageinstance
        ]);
        if($record) {
            $record->position = $position;
            $record->timemodified = time();
            $DB->update_record('tiny_collaborative_positions', $record);
        } else {
            $record = new \stdClass();
            $record->timemodified = time();
            $record->elementid = $this->elementid;
            $record->userid = $USER->id;
            $record->contextid = $this->contextid;
            $record->pageinstance = $pageinstance;
            $record->position = $position;
            $record->id = $DB->insert_record('tiny_collaborative_positions', $record);
        }
        return $record->id;
    }
    
    public function get_user_positions() {
        global $DB;
        $records = $DB->get_records('tiny_collaborative_positions', [
            'elementid' => $this->elementid,
            'contextid' => $this->contextid]);
        $positions = [];
        foreach ($records as $record) {
            $positions[] = ['userid' => $record->userid,
                            'position' => $record->position];
        }
        return $positions;
    }
    
}
