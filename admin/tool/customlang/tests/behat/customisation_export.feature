@admin @tool @customlang
Feature: Within a moodle instance, an administrator should be able to export modified langstrings.
  In order to export modified langstrings in the adminsettings of the instance,
  As an admin
  I need to be able to export the php-files of the language customisation of a language.

  Background:
   Given I log in as "admin"
    And I navigate to "Site administration > Language > Language customisation" in site administration
    And I set the field "lng" to "en"
    And I press "Open language pack for editing"
    And I press "Continue"
    And I set the field "Show strings of these components" to "moodle.php"
    And I set the field "String identifier" to "accept"
    And I press "Show strings"
    And I set the field "core/accept" to "Accept-custom_export"
    And I press "Save changes to the language pack"
    Then I should see "There are 1 modified strings."
    And I click on "Continue" "button"

    Then I log out

  @javascript
  Scenario: Switch as an admin to the adminsetting Language customisation and try to export the php-file including a customised langstring.
   Given I log in as "admin"
    And I navigate to "Site administration > Language > Language customisation" in site administration
    And I set the field "lng" to "en"
    And I click on "Export" "button"
    And I click on "Continue" "button"
    And I set the field "Select component(s) to export" to "moodle.php"
    Then I press "Export"