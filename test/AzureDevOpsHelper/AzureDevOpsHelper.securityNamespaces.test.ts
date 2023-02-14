import path from "path";
import { AzureDevOpsHelper } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { appendFile, writeFile } from "fs/promises";

test('AzureDevOpsHelper - securityNamespaces', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;

    const securityNamespaces = await azureDevOpsHelper.securityNamespaces(organization);

    const maxNumerOfTests = 5;

    for (const securityNamespace of securityNamespaces.filter(p => p.namespaceId !== undefined).slice(0, maxNumerOfTests)) {
        const namespaceId = securityNamespace.namespaceId!;

        const securityNamespaceForId = await azureDevOpsHelper.securityNamespace(organization, namespaceId);

        if(securityNamespaceForId === undefined){throw new Error('');}
    }
}, 100000);
