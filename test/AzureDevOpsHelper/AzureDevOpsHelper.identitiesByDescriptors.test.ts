import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { appendFile, writeFile     } from "fs/promises";

test('AzureDevOpsHelper - identitiesByDescriptors', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;

    const securityNamespaces = await azureDevOpsHelper.securityNamespaces(organization);
    if (securityNamespaces.error !== undefined) { throw securityNamespaces.error; }
    if (securityNamespaces.value === undefined) { throw new Error(`securityNamespaces(${organization}).value === undefined`); }

    const maxNumerOfTests = 5;

    for (const securityNamespace of securityNamespaces.value.filter(p => p.namespaceId !== undefined).slice(0, maxNumerOfTests)) {
        const securityNamespaceId = securityNamespace.namespaceId!;

        const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId });
        if (accessControlLists.error !== undefined) { throw accessControlLists.error; }
        if (accessControlLists.value === undefined) { throw new Error(`accessControlLists(${organization}, ${securityNamespaceId}).value === undefined`); }

        for (const accessControlList of accessControlLists.value) {
            for (const descriptor in accessControlList.acesDictionary) {
                const identities = await azureDevOpsHelper.identitiesByDescriptors(organization, [descriptor]);
                if (identities.error !== undefined) { throw identities.error; }
                if (identities.value === undefined) { throw new Error(`identitiesByDescriptors(${organization}, [${descriptor}]).value === undefined`); }
                if (identities.value.length !== 1) { throw new Error(`identitiesByDescriptors(${organization}, [${descriptor}]) returns ${identities.value.length} items.`) }

                const identity = await azureDevOpsHelper.identityByDescriptor(organization, descriptor);
                if (identity.error !== undefined) { throw identity.error; }
                if (identity.value === undefined) { throw new Error(`identityByDescriptor(${organization}, [${descriptor}]).value === undefined`); }
            }
        }
    }
}, 100000);

test('AzureDevOpsHelper - identityBySubjectDescriptor', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;

    const file = path.join(__dirname, 'out', `identityBySubjectDescriptor-${organization}.md`);
    await writeFile(file, 'test started');

    const users = await azureDevOpsHelper.graphUsersList(organization);
    if (users.error !== undefined) { throw users.error; }
    if (users.value === undefined) { throw new Error(`users.value === undefined`); }

    const maxNumerOfTests = 5;

    for (const user of users.value.filter(p => p.descriptor !== undefined).slice(0, maxNumerOfTests)) {
        const subjectDescriptor = user.descriptor!;

        await appendFile(file, '\n-----------------------\n');
        const identity = await azureDevOpsHelper.identityBySubjectDescriptor(organization, subjectDescriptor);
        if (identity.error !== undefined) { throw identity.error; }
        if (identity.value === undefined) { throw new Error(`identity.value === undefined [${JSON.stringify({ organization, user }, null, 2)}]`); }
        await appendFile(file, JSON.stringify({ organization, user, identity }, null, 2));
    }
    await appendFile(file, '\n-----------------------\n');
    await writeFile(file, 'test done');
}, 100000);