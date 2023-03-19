import { AzureDevOpsHelper                  } from "../../../src/AzureDevOpsHelper";
import { AzureDevOpsAccessControlListHelper } from "../../../src/models/AzureDevOpsAccessControlEntry";
import { TestConfigurationProvider          } from "../../_Configuration/TestConfiguration";


test('AzureDevOpsHelper - identitiesByDescriptors', async () => {
    const config           = await TestConfigurationProvider.get();
    const tenant           = config.azureDevOps.tenant;
    const organization     = config.azureDevOps.organization;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;
    
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);
    const securityNamespaces = await azureDevOpsHelper.securityNamespaces(organization);

    for (const securityNamespace of securityNamespaces.filter(p => p.namespaceId !== undefined)) {
        const securityNamespaceId = securityNamespace.namespaceId!;

        const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId });
        
        const identityDescriptors = AzureDevOpsAccessControlListHelper.getIdentityDescriptors(accessControlLists).slice(0, maxNumberOfTests);

        identityDescriptors.sort();

        for (const identityDescriptor of identityDescriptors) {
            const identities = await azureDevOpsHelper.identitiesByDescriptors(organization, [identityDescriptor]);
            if (identities.length !== 1) { throw new Error(JSON.stringify({ organization, descriptor: identityDescriptor, identities })) }

            const identity = await azureDevOpsHelper.identityByDescriptor(organization, identityDescriptor);
            if (identity === undefined) { throw new Error(JSON.stringify({ organization, descriptor: identityDescriptor })); }
        }
    }
}, 100000);
