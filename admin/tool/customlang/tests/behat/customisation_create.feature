@admin @tool @customlang
Feature: Within a moodle instance, an administrator should be able to modify langstrings for the entire Moodle installation.
  In order to change langstrings in the adminsettings of the instance,
  As an admin
  I need to be able to access and change values in the the language customisation of the language pack.

  @javascript
  Scenario: Switch as an admin to the adminsetting Language customisation and add a customised langstring.
   Given I log in as "admin"
    And I navigate to "Site administration > Language > Language customisation" in site administration
    And I set the field "lng" to "en"
    And I click on "Open language pack for editing" "button"
    And I click on "Continue" "button"
    And I set the field "Show strings of these components" to "moodle.php"
    And I set the field "String identifier" to "accept"
    And I press "Show strings"
	And I set the field "core/accept" to "Accept-custom"
    And I press "Save changes to the language pack"
   Then I should see "There are 1 modified strings."
   Then I press "Continue"
