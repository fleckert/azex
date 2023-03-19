import { AzureDevOpsHelper         } from "../../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - identityBySubjectDescriptor-userFromIdentity', async () => {
    const config           = await TestConfigurationProvider.get();
    const tenant           = config.azureDevOps.tenant;
    const organization     = config.azureDevOps.organization;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);
    const users = await azureDevOpsHelper.graphUsersList(organization, maxNumberOfTests);

    for (const user of users.filter(p => p.descriptor !== undefined)) {
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
