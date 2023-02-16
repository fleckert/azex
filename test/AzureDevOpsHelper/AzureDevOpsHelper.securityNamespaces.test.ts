import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - securityNamespaces', async () => {
    const config = await TestConfigurationProvider.get();
    const tenantId = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const organization = config.azureDevOps.organization;

    const securityNamespaces = await azureDevOpsHelper.securityNamespaces(organization);

    const maxNumerOfTests = 5;

    for (const securityNamespace of securityNamespaces.filter(p => p.namespaceId !== undefined).slice(0, maxNumerOfTests)) {
        const securityNamespaceId = securityNamespace.namespaceId!;

        const securityNamespaceForId = await azureDevOpsHelper.securityNamespace(organization, securityNamespaceId);

        if (securityNamespaceForId === undefined) { throw new Error(JSON.stringify({ organization, namespaceId: securityNamespaceId, securityNamespaceForId }, null, 2)); }
    }
}, 100000);
