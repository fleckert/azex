import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { appendFile, writeFile     } from "fs/promises";
import { TestHelper                } from "../_TestHelper/TestHelper";

test('AzureDevOpsHelper - classificationNodes', async () => {
    const file = path.join(__dirname, 'out', 'classificationNodes.json');
    await writeFile(file, JSON.stringify({ message: 'test started' }, null, 2));

    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;
    const project = config.azureDevOps.projectName;

    const parameters = { organization, project, depth: 10000 };
    const classificationNodes = await azureDevOpsHelper.classificationNodes(parameters);
    TestHelper.checkValueAndError(classificationNodes, parameters);
    
    await writeFile(file, JSON.stringify(classificationNodes.value, null, 2));
}, 100000);