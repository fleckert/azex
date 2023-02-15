import   path                        from "path";
import { AzureDevOpsWrapper        } from "../../src/AzureDevOpsWrapper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsWrapper - workItemProcesses', async () => {
    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization; 
    const baseUrl      = config.azureDevOps.baseUrl;
    const tenantId     = config.azureDevOps.tenantId;

    const azureDevOpsWrapper = await AzureDevOpsWrapper.instance(baseUrl, tenantId);

    const workItemProcesses = await azureDevOpsWrapper.workItemProcesses();

    for(const workItemProcess of workItemProcesses){
        const file = path.join(__dirname, 'out', `workItemProcesses-${organization}-${workItemProcess.processInfo}.json`);
        await writeFile(file, JSON.stringify(workItemProcess, null, 2));
        console.log({ file });
    }
}, 100000);
