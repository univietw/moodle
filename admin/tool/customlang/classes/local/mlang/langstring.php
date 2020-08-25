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
 * Language string based on David Mudrak langstring from local_amos.
 *
 * @package    tool_customlang
 * @copyright  2020 Ferran Recio <ferran@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace tool_customlang\local\mlang;

use moodle_exception;
use stdclass;

/**
 * Class containing a lang string cleaned.
 *
 * @package    tool_customlang
 * @copyright  2020 Ferran Recio <ferran@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Represents a single string
 */
class langstring {

    /** @var string identifier */
    public $id = null;

    /** @var string */
    public $text = '';

    /** @var int the time stamp when this string was saved */
    public $timemodified = null;

    /** @var bool is deleted */
    public $deleted = false;

    /** @var extra information about the string */
    public $extra = null;

    /** @var boolean should we skip some cleaning */
    public $nocleaning = false;

    /**
     * @param string $id string identifier
     * @param string $text string text
     * @param int $timemodified
     * @param int $deleted
     * @param stdclass $extra
     */
    public function __construct(string $id, string $text = '', int $timemodified = null,
            int $deleted = 0, stdclass $extra = null) {

        if (is_null($timemodified)) {
            $timemodified = time();
        }
        $this->id           = $id;
        $this->text         = $text;
        $this->timemodified = $timemodified;
        $this->deleted      = $deleted;
        $this->extra        = $extra;
    }

    /**
     * Returns true if the two given strings should be considered as different, false otherwise.
     *
     * Deleted strings are considered equal, regardless the actual text
     *
     * @param langstring $a
     * @param langstring $b
     * @return bool
     */
    public static function differ(langstring $a, langstring $b): bool {
        if ($a->deleted and $b->deleted) {
            return false;
        }
        if (is_null($a->text) or is_null($b->text)) {
            if (is_null($a->text) and is_null($b->text)) {
                return false;
            } else {
                return true;
            }
        }
        if ($a->nocleaning || $b->nocleaning) {
            if ($a->text === $b->text) {
                return false;
            }
        } else {
            if (trim($a->text) === trim($b->text)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Clean the string text from debris and make sure it has an expected format
     *
     * @see self::fix_syntax()
     * @param int $format the string syntax revision (1 for Moodle 1.x, 2 for Moodle 2.x)
     */
    public function clean_text(int $format=2): void {
        if ($this->nocleaning) {
            $this->text = self::fix_syntax_minimal($this->text);
        } else {
            $this->text = self::fix_syntax($this->text, $format);
        }
    }

    /**
     * Given a string text, returns it being formatted properly for storing in AMOS repository
     *
     * We need to know for what branch the string should be prepared due to internal changes in
     * format required by get_string()
     * - for get_string() in Moodle 1.6 - 1.9 use $format == 1
     * - for get_string() in Moodle 2.0 and higher use $format == 2
     *
     * Typical usages of this methods:
     *  $t = langstring::fix_syntax($t);          // sanity new translations of 2.x strings
     *  $t = langstring::fix_syntax($t, 1);       // sanity legacy 1.x strings
     *  $t = langstring::fix_syntax($t, 2, 1);    // convert format of 1.x strings into 2.x
     *
     * Backward converting 2.x format into 1.x is not supported
     *
     * @param string $text string text to be fixed
     * @param int $format target get_string() format version
     * @param int $from which format version does the text come from, defaults to the same as $format
     * @return string
     */
    public static function fix_syntax(string $text, int $format=2, ?int $from=null): string {
        if (is_null($from)) {
            $from = $format;
        }

        // common filter
        $clean = trim($text);
        $search = [
            // remove \r if it is part of \r\n
            '/\r(?=\n)/',

            // control characters to be replaced with \n
            // LINE TABULATION, FORM FEED, CARRIAGE RETURN, END OF TRANSMISSION BLOCK,
            // END OF MEDIUM, SUBSTITUTE, BREAK PERMITTED HERE, NEXT LINE, START OF STRING,
            // STRING TERMINATOR and Unicode character categorys Zl and Zp
            '/[\x{0B}-\r\x{17}\x{19}\x{1A}\x{82}\x{85}\x{98}\x{9C}\p{Zl}\p{Zp}]/u',

            // control characters to be removed
            // NULL, ENQUIRY, ACKNOWLEDGE, BELL, SHIFT {OUT,IN}, DATA LINK ESCAPE,
            // DEVICE CONTROL {ONE,TWO,THREE,FOUR}, NEGATIVE ACKNOWLEDGE, SYNCHRONOUS IDLE, ESCAPE,
            // DELETE, PADDING CHARACTER, HIGH OCTET PRESET, NO BREAK HERE, INDEX,
            // {START,END} OF SELECTED AREA, CHARACTER TABULATION {SET,WITH JUSTIFICATION},
            // LINE TABULATION SET, PARTIAL LINE {FORWARD,BACKWARD}, REVERSE LINE FEED,
            // SINGLE SHIFT {TWO,THREE}, DEVICE CONTROL STRING, PRIVATE USE {ONE,TWO},
            // SET TRANSMIT STATE, MESSAGE WAITING, {START,END} OF GUARDED AREA,
            // {SINGLE {GRAPHIC,} CHARACTER,CONTROL SEQUENCE} INTRODUCER, OPERATING SYSTEM COMMAND,
            // PRIVACY MESSAGE, APPLICATION PROGRAM COMMAND, ZERO WIDTH {,NO-BREAK} SPACE,
            // REPLACEMENT CHARACTER
            '/[\0\x{05}-\x{07}\x{0E}-\x{16}\x{1B}\x{7F}\x{80}\x{81}\x{83}\x{84}\x{86}-\x{93}\x{95}-\x{97}\x{99}-\x{9B}\x{9D}-\x{9F}\x{200B}\x{FEFF}\x{FFFD}]++/u',

            // remove trailing whitespace at the end of lines in a multiline string
            '/[ \t]+(?=\n)/',
        ];
        $replace = [
            '',
            "\n",
            '',
            '',
        ];
        $clean = preg_replace($search, $replace, $clean);

        if (($format === 2) && ($from === 2)) {
            // sanity translations of 2.x strings
            $clean = preg_replace("/\n{3,}/", "\n\n\n", $clean); // collapse runs of blank lines

        } elseif (($format === 2) && ($from === 1)) {
            // convert 1.x string into 2.x format
            $clean = preg_replace("/\n{3,}/", "\n\n\n", $clean); // collapse runs of blank lines
            $clean = preg_replace('/%+/', '%', $clean); // collapse % characters
            $clean = str_replace('\$', '@@@___XXX_ESCAPED_DOLLAR__@@@', $clean); // remember for later
            $clean = str_replace("\\", '', $clean); // delete all slashes
            $clean = preg_replace('/(^|[^{])\$a\b(\->[a-zA-Z0-9_]+)?/', '\\1{$a\\2}', $clean); // wrap placeholders
            $clean = str_replace('@@@___XXX_ESCAPED_DOLLAR__@@@', '$', $clean);
            $clean = str_replace('&#36;', '$', $clean);

        } elseif (($format === 1) && ($from === 1)) {
            // sanity legacy 1.x strings
            $clean = preg_replace("/\n{3,}/", "\n\n", $clean); // collapse runs of blank lines
            $clean = str_replace('\$', '@@@___XXX_ESCAPED_DOLLAR__@@@', $clean);
            $clean = str_replace("\\", '', $clean); // delete all slashes
            $clean = str_replace('$', '\$', $clean); // escape all embedded variables
            // unescape placeholders: only $a and $a->something are allowed. All other $variables are left escaped
            $clean = preg_replace('/\\\\\$a\b(\->[a-zA-Z0-9_]+)?/', '$a\\1', $clean); // unescape placeholders
            $clean = str_replace('@@@___XXX_ESCAPED_DOLLAR__@@@', '\$', $clean);
            $clean = str_replace('"', "\\\"", $clean); // add slashes for "
            $clean = preg_replace('/%+/', '%', $clean); // collapse % characters
            $clean = str_replace('%', '%%', $clean); // duplicate %

        } else {
            throw new moodle_exception('Unknown get_string() format version');
        }
        return $clean;
    }

    /**
     * Making minimal sanitize of string, no trims or double lines deletion
     *
     * @param string $text string text to be fixed
     * @return string
     */
    public static function fix_syntax_minimal(string $text): string {
        $search = [
            // remove \r if it is part of \r\n
            '/\r(?=\n)/',

            // control characters to be replaced with \n
            // LINE TABULATION, FORM FEED, CARRIAGE RETURN, END OF TRANSMISSION BLOCK,
            // END OF MEDIUM, SUBSTITUTE, BREAK PERMITTED HERE, NEXT LINE, START OF STRING,
            // STRING TERMINATOR and Unicode character categorys Zl and Zp
            '/[\x{0B}-\r\x{17}\x{19}\x{1A}\x{82}\x{85}\x{98}\x{9C}\p{Zl}\p{Zp}]/u',

            // control characters to be removed
            // NULL, ENQUIRY, ACKNOWLEDGE, BELL, SHIFT {OUT,IN}, DATA LINK ESCAPE,
            // DEVICE CONTROL {ONE,TWO,THREE,FOUR}, NEGATIVE ACKNOWLEDGE, SYNCHRONOUS IDLE, ESCAPE,
            // DELETE, PADDING CHARACTER, HIGH OCTET PRESET, NO BREAK HERE, INDEX,
            // {START,END} OF SELECTED AREA, CHARACTER TABULATION {SET,WITH JUSTIFICATION},
            // LINE TABULATION SET, PARTIAL LINE {FORWARD,BACKWARD}, REVERSE LINE FEED,
            // SINGLE SHIFT {TWO,THREE}, DEVICE CONTROL STRING, PRIVATE USE {ONE,TWO},
            // SET TRANSMIT STATE, MESSAGE WAITING, {START,END} OF GUARDED AREA,
            // {SINGLE {GRAPHIC,} CHARACTER,CONTROL SEQUENCE} INTRODUCER, OPERATING SYSTEM COMMAND,
            // PRIVACY MESSAGE, APPLICATION PROGRAM COMMAND, ZERO WIDTH {,NO-BREAK} SPACE,
            // REPLACEMENT CHARACTER
            '/[\0\x{05}-\x{07}\x{0E}-\x{16}\x{1B}\x{7F}\x{80}\x{81}\x{83}\x{84}\x{86}-\x{93}\x{95}-\x{97}\x{99}-\x{9B}\x{9D}-\x{9F}\x{200B}\x{FEFF}\x{FFFD}]++/u',
        ];
        $replace = [
            '',
            "\n",
            '',
        ];
        $clean = preg_replace($search, $replace, $text);
        return $clean;
    }
}
