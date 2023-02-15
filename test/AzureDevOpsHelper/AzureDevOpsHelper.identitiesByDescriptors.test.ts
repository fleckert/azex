import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { appendFile, writeFile     } from "fs/promises";

test('AzureDevOpsHelper - identitiesByDescriptors', async () => {
    const config = await TestConfigurationProvider.get();
    const tenantId = config.azureDevOps.tenantId;
    const azureDevOpsHelper = new AzureDevOpsHelper(tenantId);
    const organization = config.azureDevOps.organization;

    const securityNamespaces = await azureDevOpsHelper.securityNamespaces(organization);

    const maxNumerOfTests = 5;

    for (const securityNamespace of securityNamespaces.filter(p => p.namespaceId !== undefined).slice(0, maxNumerOfTests)) {
        const securityNamespaceId = securityNamespace.namespaceId!;

        const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId });

        for (const accessControlList of accessControlLists) {
            for (const descriptor in accessControlList.acesDictionary) {
                const identities = await azureDevOpsHelper.identitiesByDescriptors(organization, [descriptor]);
                if (identities.length !== 1) { throw new Error(JSON.stringify({ organization, descriptor, identities })) }

                const identity = await azureDevOpsHelper.identityByDescriptor(organization, descriptor);
                if (identity === undefined) { throw new Error(JSON.stringify({ organization, descriptor })); }
            }
        }
    }
}, 100000);

test('AzureDevOpsHelper - identityBySubjectDescriptor', async () => {
    const config = await TestConfigurationProvider.get();
    const tenantId = config.azureDevOps.tenantId;
    const azureDevOpsHelper = new AzureDevOpsHelper(tenantId);
    const organization = config.azureDevOps.organization;

    const file = path.join(__dirname, 'out', `identityBySubjectDescriptor-${organization}.md`);
    await writeFile(file, 'test started');

    const users = await azureDevOpsHelper.graphUsersList(organization);

    const maxNumerOfTests = 5;

    for (const user of users.filter(p => p.descriptor !== undefined).slice(0, maxNumerOfTests)) {
        const subjectDescriptor = user.descriptor!;

        await appendFile(file, '\n-----------------------\n');
        const identity = await azureDevOpsHelper.identityBySubjectDescriptor(organization, subjectDescriptor);
        await appendFile(file, JSON.stringify({ organization, user, identity }, null, 2));
    }
    await appendFile(file, '\n-----------------------\n');
    await writeFile(file, 'test done');
}, 100000);