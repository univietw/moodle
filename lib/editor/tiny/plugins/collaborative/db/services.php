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

/**
 * External service definitions for tiny_collaborative
 *
 * @package tiny_collaborative
 * @copyright 2024 Thomas Wedekind <thomas.wedekind@univie.ac.at>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die;

$functions = [
    'tiny_collaborate_get_changes' => array(
        'classname' => 'tiny_collaborative\external\get_changes',
        'methodname' => 'execute',
        'description' => 'Get changes based on hash',
        'type' => 'read',
        'loginrequired' => false,
        'ajax' => true,
    ),
    'tiny_collaborate_save_changes' => array(
        'classname' => 'tiny_collaborative\external\save_changes',
        'methodname' => 'execute',
        'description' => 'Save changes the user made in a collaborative session',
        'type' => 'write',
        'loginrequired' => false,
        'ajax' => true,
    ),
    'tiny_collaborate_set_position' => array(
        'classname' => 'tiny_collaborative\external\save_changes',
        'methodname' => 'execute',
        'description' => 'Save changes the user made in a collaborative session',
        'type' => 'write',
        'loginrequired' => false,
        'ajax' => true,
    ),
];
