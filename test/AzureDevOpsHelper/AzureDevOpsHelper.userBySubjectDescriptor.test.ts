import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - userBySubjectDescriptor', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;

    const users = await azureDevOpsHelper.graphUsersList(organization);

    const maxNumerOfTests = 10;

    for (const user of users.filter(p => p.descriptor !== undefined).slice(0, maxNumerOfTests)) {
        const userNew = await azureDevOpsHelper.userBySubjectDescriptor(organization, user.descriptor!)
        if (userNew.error !== undefined) { throw userNew.error; }
        if (userNew.value === undefined) { throw new Error("userNew.value === undefined"); }
    }
}, 100000);
