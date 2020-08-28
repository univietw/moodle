@admin @tool @customlang
Feature: Within a moodle instance, an administrator should be able to export modified langstrings.
  In order to export modified langstrings in the adminsettings of the instance,
  As an admin
  I need to be able to export the php-files of the language customisation of a language.

  @javascript
  Scenario:
   Given I log in as "admin"
    And I navigate to "Site administration > Language > Language customisation" in site administration
    And I set the field "lng" to "en"
    Then I should not see "Export"