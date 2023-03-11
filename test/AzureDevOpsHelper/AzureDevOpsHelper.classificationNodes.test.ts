import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { mkdir, rm, writeFile     } from "fs/promises";

test('AzureDevOpsHelper - classificationNodes', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const projectName  = config.azureDevOps.projectName;
    const tenantId     = config.azureDevOps.tenantId;

    await mkdir(path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_')), { recursive: true });
    const file = path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), `${organization}-${projectName}-classificationNodes.json`.replaceAll(' ', '_'));
    await rm(file, { force: true });

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

    const parameters = { organization, project: projectName, depth: 10000 };
    const classificationNodes = await azureDevOpsHelper.classificationNodes(parameters);

    await writeFile(file, JSON.stringify(classificationNodes, null, 2));

    if (classificationNodes.length === 0) { throw new Error(JSON.stringify({ parameters }, null, 2)); }

    console.log({ file });
}, 100000);