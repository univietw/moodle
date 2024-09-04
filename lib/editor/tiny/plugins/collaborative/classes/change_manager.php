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
class change_manager {

    /** @var int The contextid */
    protected $contextid;

    /** @var string The elementid for this editor */
    protected $elementid;

    protected $oldcontenthash;

    /**
     * Constructor for the autosave manager.
     *
     * @param int $contextid The contextid of the session
     * @param string $pagehash The page hash
     * @param string $pageinstance The page instance
     * @param string $elementid The element id
     * @param null|stdClass $user The user object for the owner of the autosave
     */
    public function __construct(
        int $contextid,
        string $elementid,
        string $oldcontenthash
    ) {
        global $DB;
        $this->contextid = $contextid;
        $this->elementid = $elementid;
        $this->oldcontenthash = $oldcontenthash;
    }

    public function add_collaborative_record($id,$newcontenthash, $changes) {
        global $DB,$USER;
        if($id) {
            $lockfactory = \core\lock\lock_config::get_lock_factory('moodle');
            $resourcename = 'tiny_collaborative_changes'. $id;
            $sql = "SELECT *
                FROM {tiny_collaborative_changes}
                WHERE contextid = :contextid
                AND elementid = :elementid
                AND id > :id";
            $lock = $lockfactory->get_lock($resourcename, 1);
            if($lock) {
                $DB->record_exists_sql($sql, ['contextid' => $this->contextid, 'elementid' => $this->elementid, 'id' => $id]);
                if(!$this->get_changes($id)) {
                    $record = new \stdClass();
                    $record->oldcontenthash = $this->oldcontenthash;
                    $record->newcontenthash = $newcontenthash;
                    $record->timemodified = time();
                    $record->changes = $changes;
                    $record->contextid = $this->contextid;
                    $record->elementid = $this->elementid;
                    $record->userid = $USER->id;
                    $record->id = $DB->insert_record('tiny_collaborative_changes', $record);
                    $lock->release();
                    return $record->id;
                } else {
                    $lock->release();
                }
                return -1;
            }
        } else {
            $record = new \stdClass();
            $record->oldcontenthash = $this->oldcontenthash;
            $record->newcontenthash = $newcontenthash;
            $record->timemodified = time();
            $record->changes = $changes;
            $record->contextid = $this->contextid;
            $record->elementid = $this->elementid;
            $record->userid = $USER->id;
            $record->id = $DB->insert_record('tiny_collaborative_changes', $record);
            return $record->id;
        }
    }

    public function get_changes($id = 0) {
        global $DB;
        $changesarray = [];
        if($id) {
            $sql = "SELECT * 
                      FROM {tiny_collaborative_changes}
                      WHERE contextid = :contextid
                        AND elementid = :elementid
                        AND id > :id";
            $changes = $DB->get_record_sql($sql,['contextid' => $this->contextid, 'elementid' => $this->elementid, 'id'=> $id]);
            foreach ($changes as $change) {
                $changesarray[] = [
                    'id' => $change->id,
                    'changes' => $change->changes,
                    'newcontenthash' => $change->newcontenthash
                ];
            }
        } else {
            $currenthash = $this->oldcontenthash;
            while ($change = $DB->get_record('tiny_collaborative_changes', ['oldcontenthash' => $currenthash,
                'elementid' => $this->elementid,
                'contextid' => $this->contextid
            ])) {
                $changesarray[] = [ 
                    'id' => $change->id,
                    'changes' => $change->changes,
                    'newcontenthash' => $change->newcontenthash
                    ];
                $currenthash = $change->newcontenthash;
            }
        }
        return $changesarray;
    }

}
