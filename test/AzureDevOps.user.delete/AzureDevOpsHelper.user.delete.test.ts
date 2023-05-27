import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - user - delete', async () => {

    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenant            = config.azureDevOps.tenant;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    const userDescriptor = '';

    if(`${userDescriptor}` !== ''){
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/users/delete?view=azure-devops-rest-7.0&tabs=HTTP
        await azureDevOpsHelper.delete(`https://vssps.dev.azure.com/${organization}/_apis/graph/users/${userDescriptor}?api-version=7.0-preview.1`, 204)
    }
}, 100000);

 