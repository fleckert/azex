import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsHelper-graphSubjectQueryByPrincipalName-user', async () => {
    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenantId = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

    const users = await azureDevOpsHelper.graphUsersList(organization);

    const maxNumerOfTests = 5;

    for (const graphUser of users.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphUser.principalName!;
        const graphSubject = await azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, ['User'], principalName);
        if (graphSubject === undefined) { throw new Error(JSON.stringify({organization, principalName})); }
    }
}, 100000);

test('AzureDevOpsHelper-graphSubjectQueryByPrincipalName-users-notExist', async () => {
    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenantId = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

    const principalName = "does-not-exist";
    const graphSubject = await azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, ['User'], principalName);
    if (graphSubject !== undefined) { throw new Error(JSON.stringify({ organization, principalName })); }
}, 100000);

test('AzureDevOpsHelper-graphSubjectQueryByPrincipalName-groups', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenantId          = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const maxNumerOfTests   = 5;

    const groups = await azureDevOpsHelper.graphGroupsList(organization, maxNumerOfTests);

    for (const group of groups) {
        if (group.principalName === undefined) {
            continue;
        }

        const principalName = group.principalName;

        const graphSubject = await azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, ['Group'], principalName);
        if (graphSubject === undefined) { throw new Error(JSON.stringify({ organization, principalName })); }
    }
}, 100000);

test('AzureDevOpsHelper-graphSubjectQueryByPrincipalName-groups-notExist', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenantId          = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

    const principalName = "does-not-exist";
    const graphSubject = await azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, ['Group'], principalName);
    if (graphSubject !== undefined) { throw new Error(JSON.stringify({ organization, principalName, graphSubject })); }
}, 100000);