import   path                        from "path";
import { AzureDevOpsHelper         } from "../../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../../_Configuration/TestConfiguration";
import { mkdir, rm, writeFile      } from "fs/promises";

test('AzureDevOpsHelper - inviteUser', async () => {
    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenantId = config.azureDevOps.tenantId;

    const principalName = '';

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

    if (`${principalName}` !== '') {
        await mkdir(path.join(__dirname, 'out', organization), { recursive: true });
        const file = path.join(__dirname, 'out', organization, `${organization}-${principalName}.json`)
        await rm(file, { force: true });
        
        const response = await azureDevOpsHelper.inviteUser(organization, principalName, 'express');
        
        await writeFile(file, JSON.stringify(response, null, 2));
    }
}, 100000);