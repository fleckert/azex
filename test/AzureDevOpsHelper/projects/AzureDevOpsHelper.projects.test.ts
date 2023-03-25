import   path                        from "path";
import { AzureDevOpsHelper         } from "../../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../../_Configuration/TestConfiguration";
import { mkdir, rm, writeFile      } from "fs/promises";

test('AzureDevOpsHelper - projects', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenant            = config.azureDevOps.tenant;
    const maxNumberOfTests  = config.azureDevOps.maxNumberOfTests;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    await mkdir(path.join(__dirname, organization, 'out'), { recursive: true });
    const file = path.join(__dirname, organization, 'out', `${organization}-projects.json`)
    await rm(file, { force: true });
    const projects = await azureDevOpsHelper.projects(organization, maxNumberOfTests);
    await writeFile(file, JSON.stringify(projects, null, 2));

    console.log({ file });
}, 200000);
