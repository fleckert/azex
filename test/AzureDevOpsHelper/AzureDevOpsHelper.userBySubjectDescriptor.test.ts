import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - userBySubjectDescriptor', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;

    const users = await azureDevOpsHelper.graphUsersList(organization);
    if (users.error !== undefined) { throw users.error; }
    if (users.value === undefined) { throw new Error("users.value === undefined"); }

    const maxNumerOfTests = 10;

    for (const user of users.value.filter(p => p.descriptor !== undefined).slice(0, maxNumerOfTests)) {
        const userNew = await azureDevOpsHelper.userBySubjectDescriptor(organization, user.descriptor!)
        if (userNew.error !== undefined) { throw users.error; }
        if (userNew.value === undefined) { throw new Error("userNew.value === undefined"); }
    }
}, 100000);
