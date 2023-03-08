import path from "path";
import { AzureDevOpsHelper } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile } from "fs/promises";


test('AzureDevOpsHelper - sanitize-filename', async () => {
    const values = [
        '[project]\\name with blanks',
        'user@company.com'
    ];

    const regex = new RegExp('[^a-zA-Z0-9_]', 'g');

    const valuesClean = values.map(p => {return p.replaceAll(regex, '_').replaceAll('__', '_')});
    
    console.log({valuesClean});

}, 200000);