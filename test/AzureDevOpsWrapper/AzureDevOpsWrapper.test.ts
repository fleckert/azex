import   path                        from "path";
import { AzureDevOpsWrapper        } from "../../src/AzureDevOpsWrapper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsWrapper - tbd', async () => {
    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const baseUrl = config.azureDevOps.baseUrl;
    const tenant    = config.azureDevOps.tenant;
    const azureDevOpsWrapper = await AzureDevOpsWrapper.instance(baseUrl, tenant);
    
    const file = path.join(__dirname, 'out', `tbd-${organization}.json`);
    await writeFile(file, 'test started');
    // const projects = await azureDevOpsWrapper.projects();
    // await writeFile(file, JSON.stringify(projects, null, 2));
}, 100000);
