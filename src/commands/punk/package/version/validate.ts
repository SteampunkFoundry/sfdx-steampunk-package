
import * as csv from 'csv-parser';
import * as fs from 'fs-extra';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file.
// Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@steampunk/sfdx-steampunk-data', 'validate');

export default class Validate extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [messages.getMessage('commandExamples')];

  protected static flagsConfig = {
    definitionfile: flags.filepath({
      char: 'f',
      description: messages.getMessage('definitionFile'),
    })
  };

  protected static requiresDevhub = true;

  public async run(): Promise<any> {
    // this.hubOrg is guaranteed because requiresDevhub=true, as opposed to supportsDevhub
    const conn = this.hubOrg.getConnection();

    const csvFilePath = this.flags.filepath;

    this.ux.startSpinner("Reading CSV");

    let filesToUpload = await this.readFile(csvFilePath);

    this.ux.stopSpinner();

    this.ux.startSpinner("Loading files");

    const createCsvWriter = require("csv-writer").createObjectCsvWriter;

    const successWriter = createCsvWriter({
      path: "success.csv",
      header: [
        { id: "PathOnClient", title: "PathOnClient" },
        { id: "Title", title: "Title" },
        { id: "FirstPublishLocationId", title: "FirstPublishLocationId" },
        { id: "ContentDocumentId", title: "ContentDocumentId" },
      ],
    });

    const errorWriter = createCsvWriter({
      path: "error.csv",
      header: [
        { id: "PathOnClient", title: "PathOnClient" },
        { id: "Title", title: "Title" },
        { id: "FirstPublishLocationId", title: "FirstPublishLocationId" },
        { id: "Error", title: "Error" }
      ],
    });

    for (let [i, file] of filesToUpload.entries()) {
      let success = [];
      let failure = [];
      this.ux.startSpinner(`Loading file ${i + 1} of ${filesToUpload.length}`);
      try {
        const CV = (await fileToContentVersion(
          conn,
          file.PathOnClient,
          file.Title,
          file.FirstPublishLocationId
        )) as ContentVersion;

        file.ContentDocumentId = CV.ContentDocumentId;
        success.push(file);
        await successWriter.writeRecords(success);
      } catch (error) {
        file.Error = error;
        failure.push(file);
        await errorWriter.writeRecords(failure);
      } finally {
        this.ux.stopSpinner();
      }
    }

    return "Success";
  }
}
