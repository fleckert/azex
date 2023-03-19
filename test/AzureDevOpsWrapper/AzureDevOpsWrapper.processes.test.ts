import   path                        from "path";
import { AzureDevOpsWrapper        } from "../../src/AzureDevOpsWrapper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsWrapper - processes', async () => {
    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const baseUrl      = config.azureDevOps.baseUrl;
    const tenant       = config.azureDevOps.tenant;
    const azureDevOpsWrapper = await AzureDevOpsWrapper.instance(baseUrl, tenant);
    
    const file = path.join(__dirname, 'out', `processes-${organization}.json`);
    const processes = await azureDevOpsWrapper.processes();
    await writeFile(file, JSON.stringify(processes, null, 2));

    for (const processId of processes.filter(p => p.id !== undefined).map(p => p.id)) {
        const process = await azureDevOpsWrapper.process(processId!);
        const fileProcess = path.join(__dirname, 'out', `processes-${organization}-${process.name}.json`);
        await writeFile(fileProcess, JSON.stringify(process, null, 2));
    }
}, 100000);
