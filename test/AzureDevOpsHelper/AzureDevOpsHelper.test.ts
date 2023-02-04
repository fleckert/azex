import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - userByPrincipalName', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();

    const users = await azureDevOpsHelper.graphUsersList(config.azureDevOps.organization);
    if (users.error !== undefined) { throw users.error; }
    if (users.value === undefined) { throw new Error("users.value === undefined"); }

    const maxNumerOfTestsUsers = 10;

    for (const graphUser of users.value.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTestsUsers)) {
        const principalName = graphUser.principalName!;

        const graphSubject = await azureDevOpsHelper.userByPrincipalName(config.azureDevOps.organization, principalName);
        if (graphSubject.error !== undefined) { throw graphSubject.error; }
        if (graphSubject.value === undefined) { throw new Error(`Failed to resolve user for organization[${config.azureDevOps.organization}] principalName[${principalName}].`); }
    }

    const principalName = "does-not-exist";
    const graphSubject = await azureDevOpsHelper.userByPrincipalName(config.azureDevOps.organization, principalName);
    if (graphSubject.error !== undefined) { throw graphSubject.error; }
    if (graphSubject.value !== undefined) { throw new Error(`Resolved non-existent user for organization[${config.azureDevOps.organization}] principalName[${principalName}].`); }
}, 100000);

test('AzureDevOpsHelper - groupByPrincipalName', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();

    const groups = await azureDevOpsHelper.graphGroupsList(config.azureDevOps.organization);
    if (groups.error !== undefined) { throw groups.error; }
    if (groups.value === undefined) { throw new Error("groups.value === undefined"); }

    const maxNumerOfTestsGroups = 10;

    for (const graphGroup of groups.value.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTestsGroups)) {
        const principalName = graphGroup.principalName!;

        const graphSubject = await azureDevOpsHelper.groupByPrincipalName(config.azureDevOps.organization, principalName);
        if (graphSubject.error !== undefined) { throw graphSubject.error; }
        if (graphSubject.value === undefined) { throw new Error(`Failed to resolve group for organization[${config.azureDevOps.organization}] principalName[${principalName}].`); }
    }

    const principalName = "does-not-exist";
    const graphSubject = await azureDevOpsHelper.groupByPrincipalName(config.azureDevOps.organization, principalName);
    if (graphSubject.error !== undefined) { throw graphSubject.error; }
    if (graphSubject.value !== undefined) { throw new Error(`Resolved non-existent group for organization[${config.azureDevOps.organization}] principalName[${principalName}].`); }
}, 100000);
