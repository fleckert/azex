import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsHelper - identityBySubjectDescriptor-userFromIdentity', async () => {
    const config = await TestConfigurationProvider.get();
    const tenantId = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const organization = config.azureDevOps.organization;

    const file = path.join(__dirname, 'out', `test-graphUsersList-${organization}.json`);
    await writeFile(file, JSON.stringify({ message: 'test started' }, null, 2));

    const users = await azureDevOpsHelper.graphUsersList(organization);

    const maxNumerOfTests = 10;

    for (const user of users.filter(p => p.descriptor !== undefined).slice(0, maxNumerOfTests)) {
        const subjectDescriptor = user.descriptor!;
        const identity = await azureDevOpsHelper.identityBySubjectDescriptor(organization, subjectDescriptor)
        if (identity?.descriptor === undefined) { throw new Error(JSON.stringify({ organization, subjectDescriptor, identity }, null, 2)); }

        // identity.value.descriptor is a complex object in the npm package, but here it is a string
        const identityDescriptor = `${identity.descriptor}`;
        const userNew = await azureDevOpsHelper.userFromIdentity(organization, identityDescriptor);
        if (userNew === undefined) { throw new Error(JSON.stringify({ organization, identityDescriptor })); }

        if (user.descriptor !== userNew.descriptor) {
            throw new Error(JSON.stringify({ user, identity, userNew }, null, 2));
        }
    }
}, 100000);
