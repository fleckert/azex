import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper                } from "../_TestHelper/TestHelper";

test('AzureDevOpsHelper - userByPrincipalName', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;

    const users = await azureDevOpsHelper.graphUsersList(organization);
    TestHelper.checkValueAndError(users, { organization });

    const maxNumerOfTests = 5;

    for (const graphUser of users.value!.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphUser.principalName!;

        const graphSubject = await azureDevOpsHelper.userByPrincipalName(organization, principalName);
        TestHelper.checkValueAndError(graphSubject, { organization, principalName });
    }

    const principalName = "does-not-exist";
    const graphSubject = await azureDevOpsHelper.userByPrincipalName(organization, principalName);
    if (graphSubject.error !== undefined) { throw graphSubject.error; }
    if (graphSubject.value !== undefined) { throw new Error(`Resolved non-existent user for organization[${organization}] principalName[${principalName}].`); }
}, 100000);