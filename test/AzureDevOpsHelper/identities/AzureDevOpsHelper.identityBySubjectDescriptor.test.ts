import { AzureDevOpsHelper         } from "../../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - identityBySubjectDescriptor', async () => {
    const config           = await TestConfigurationProvider.get();
    const tenantId         = config.azureDevOps.tenantId;
    const organization     = config.azureDevOps.organization;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const usersPromise =  azureDevOpsHelper.graphUsersList (organization, maxNumberOfTests);
    const groupsPromise = azureDevOpsHelper.graphGroupsList(organization, maxNumberOfTests);

    const collection = [...await usersPromise, ...await groupsPromise];

    for (const item of collection.filter(p => p.descriptor !== undefined)) {
        const subjectDescriptor = item.descriptor!;

        const identity = await azureDevOpsHelper.identityBySubjectDescriptor(organization, subjectDescriptor);
        if (identity === undefined) { throw new Error(JSON.stringify({organization, subjectDescriptor})); }
    }
}, 100000);
