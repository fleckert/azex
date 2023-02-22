import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - userBySubjectDescriptor', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenantId          = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const maxNumberOfTests  = config.azureDevOps.maxNumberOfTests;

    const users = await azureDevOpsHelper.graphUsersList(organization);

    for (const user of users.filter(p => p.descriptor !== undefined).slice(0, maxNumberOfTests)) {
        const subjectDescriptor = user.descriptor!;
        const userNew = await azureDevOpsHelper.userBySubjectDescriptor(organization, subjectDescriptor)
        if (userNew === undefined) { throw new Error(JSON.stringify({ organization, user, subjectDescriptor })); }
    }
}, 100000);
