import path from "path";
import { AzureDevOpsHelper } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { appendFile, writeFile } from "fs/promises";

test('AzureDevOpsHelper - securityNamespaces', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;

    const securityNamespaces = await azureDevOpsHelper.securityNamespaces(organization);
    if (securityNamespaces.error !== undefined) { throw securityNamespaces.error; }
    if (securityNamespaces.value === undefined) { throw new Error(`securityNamespaces(${organization}).value === undefined`); }

    const maxNumerOfTests = 5;

    for (const securityNamespace of securityNamespaces.value.filter(p => p.namespaceId !== undefined).slice(0, maxNumerOfTests)) {
        const namespaceId = securityNamespace.namespaceId!;

        const securityNamespaceForId = await azureDevOpsHelper.securityNamespace(organization, namespaceId);
        if (securityNamespaceForId.error !== undefined) { throw securityNamespaceForId.error; }
        if (securityNamespaceForId.value === undefined) { throw new Error(`securityNamespaces(${organization}, ${namespaceId}).value === undefined`); }
    }
}, 100000);
