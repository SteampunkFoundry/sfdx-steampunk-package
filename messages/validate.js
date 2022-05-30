module.exports = {
  commandDescription: `Validate a package version`,
  filepathFlagDescription: `Path to csv file`,
  errorNoOrgResults: `No results found for the org '%s'.`,
  commandExamples: [
    `$ sfdx punk:package:version:validate`,
    `$ sfdx punk:package:version:validate -f config/project-scratch-def.json`
  ]
};
