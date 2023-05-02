import { AzureDevOpsHelper         } from "../../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";
import { TestHelper                } from "../../_TestHelper/TestHelper";

test('AzureDevOpsHelper - inviteUser', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenant       = config.azureDevOps.tenant;

    const principalName = '';

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    if (`${principalName}` !== '') {
        const file = await TestHelper.prepareFile([__dirname, 'out', organization, `${organization}-${principalName}.json`]);
        
        const response = await azureDevOpsHelper.inviteUser(organization, principalName, 'express');
        
        await writeFile(file, JSON.stringify(response, null, 2));

        console.log({ file })
    }
}, 100000);