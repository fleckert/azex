import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - userByPrincipalName', async () => {
    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenantId = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

    const users = await azureDevOpsHelper.graphUsersList(organization);

    const maxNumerOfTests = 5;

    for (const graphUser of users.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphUser.principalName!;
        const graphSubject = await azureDevOpsHelper.userByPrincipalName(organization, principalName);
        if (graphSubject === undefined) { throw new Error(JSON.stringify({organization, principalName})); }
    }
}, 100000);

test('AzureDevOpsHelper - userByPrincipalName-notExist', async () => {
    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenantId = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

    const principalName = "does-not-exist";
    const graphSubject = await azureDevOpsHelper.userByPrincipalName(organization, principalName);
    if (graphSubject !== undefined) { throw new Error(JSON.stringify({ organization, principalName })); }
}, 100000);