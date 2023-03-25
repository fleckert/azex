import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { Helper                    } from "../../src/Helper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - user - update', async () => {

    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = 1??config.azureDevOps.maxNumberOfTests;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    const users = await azureDevOpsHelper.graphUsersList(organization, maxNumberOfTests);

    const userEntitlements = await Helper.batchCalls(
        users.filter(p => p.descriptor !== undefined),
        user => azureDevOpsHelper.userEntitlements(organization, user.descriptor!)
    );
 
    for (const userEntitlement of userEntitlements) {
        if ('id' in userEntitlement) {
            //const profile = await azureDevOpsHelper.profile(userEntitlement.parameters.);
        }
    }
}, 100000);

 