import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsHelper - identityBySubjectDescriptor-userFromIdentity', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;

    const file = path.join(__dirname, 'out', `test-graphUsersList-${organization}.json`);
    await writeFile(file, JSON.stringify({ message: 'test started' }, null, 2));

    const users = await azureDevOpsHelper.graphUsersList(organization);

    const maxNumerOfTests = 10;

    for (const user of users.filter(p => p.descriptor !== undefined).slice(0, maxNumerOfTests)) {
        const identity = await azureDevOpsHelper.identityBySubjectDescriptor(organization, user.descriptor!)
        if (identity.error !== undefined) { throw identity.error; }
        if (identity.value === undefined) { throw new Error("identity.value === undefined"); }
        if (identity.value.descriptor === undefined) { throw new Error("identity.value.descriptor === undefined"); }

        // identity.value.descriptor is a complex object in the npm package, but here it is a string
        const userNew = await azureDevOpsHelper.userFromIdentity(organization, `${identity.value.descriptor}`);
        if (userNew.error !== undefined) { throw userNew.error; }
        if (userNew.value === undefined) { throw new Error("userNew.value === undefined"); }

        if (user.descriptor !== userNew.value.descriptor) {
            throw new Error(`user.descriptor !== userNew.value.descriptor ${JSON.stringify({ user, identity, userNew }, null, 2)}`);
        }
    }
}, 100000);
