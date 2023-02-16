import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { appendFile, writeFile     } from "fs/promises";

test('AzureDevOpsHelper - classificationNodes', async () => {
    const file = path.join(__dirname, 'out', 'classificationNodes.json');
    await writeFile(file, JSON.stringify({ message: 'test started' }, null, 2));

    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const project = config.azureDevOps.projectName;
    const tenantId = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

    const parameters = { organization, project, depth: 10000 };
    const classificationNodes = await azureDevOpsHelper.classificationNodes(parameters);

    await writeFile(file, JSON.stringify(classificationNodes, null, 2));

    if (classificationNodes.length === 0) { throw new Error(JSON.stringify({ parameters }, null, 2)); }
}, 100000);