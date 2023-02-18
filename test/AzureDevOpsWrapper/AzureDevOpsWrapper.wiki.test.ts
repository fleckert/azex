import   path                        from "path";
import { AzureDevOpsWrapper        } from "../../src/AzureDevOpsWrapper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsWrapper - wiki', async () => {
    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const projectName  = config.azureDevOps.projectName;
    const baseUrl      = config.azureDevOps.baseUrl;
    const tenantId     = config.azureDevOps.tenantId;

    const azureDevOpsWrapper = await AzureDevOpsWrapper.instance(baseUrl, tenantId);

    const wikis = await azureDevOpsWrapper.wikiPaths(projectName);

    console.log(wikis);
}, 100000);
