import   path                        from "path";
import { AzureDevOpsWrapper        } from "../../src/AzureDevOpsWrapper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsWrapper - projects', async () => {
    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const baseUrl = config.azureDevOps.baseUrl;
    const azureDevOpsWrapper = await AzureDevOpsWrapper.instance(baseUrl);
    
    const file = path.join(__dirname, 'out', `projects-${organization}.json`);
    await writeFile(file, 'test started');
    const projects = await azureDevOpsWrapper.projects();
    await writeFile(file, JSON.stringify(projects, null, 2));
}, 100000);
