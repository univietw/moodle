@admin @tool @customlang @_file_upload
Feature: Within a moodle instance, an administrator should be able to import modified langstrings.
  In order to import modified langstrings in the adminsettings from one to another instance,
  As an admin
  I need to be able to import the php-files of the language customisation of a language.


  @javascript
  Scenario: Switch as an admin to the adminsetting Language customisation and try to import a php-file
   Given I log in as "admin"
    And I navigate to "Site administration > Language > Language customisation" in site administration
    And I set the field "lng" to "en"
    And I click on "Import custom strings" "button"
    And I click on "Continue" "button"
    And I upload "admin/tool/customlang/tests/fixtures/moodle.php" file to "Language component(s)" filemanager
    And I set the field "Import mode" to "Create or update all strings from the component(s)"
    And I press "Import file"
  Then I should see "String core/accept updated successfully."
    And I click on "Continue" "button"
  Then I should see "There are 1 modified strings."
    And I click on "Save strings to language pack" "button"
    And I click on "Continue" "button"

    Then I log out

   Given I log in as "admin"
    And I navigate to "Site administration > Language > Language customisation" in site administration
    And I set the field "lng" to "en"
    And I click on "Open language pack for editing" "button"
    And I click on "Continue" "button"
    And I set the field "Show strings of these components" to "moodle.php"
    And I set the field "String identifier" to "accept"
    And I press "Show strings"
    Then I should see "Accept-custom_import"