import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";
test('AzureDevOpsHelper - securityNamespaces', async () => {
    const config            = await TestConfigurationProvider.get();
    const tenantId          = config.azureDevOps.tenantId;
    const organization      = config.azureDevOps.organization;
    const testName          = 'securityNamespaces';

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

    const file = path.join(__dirname, 'out', `${testName}-${organization}.json`);
    
    await writeFile(file, JSON.stringify({ message: 'test started' }, null, 2));
    const securityNamespaces = await azureDevOpsHelper.securityNamespaces(organization);
    await writeFile(file, JSON.stringify(securityNamespaces, null, 2));

    console.log(file);

    const maxNumerOfTests = 5;

    for (const securityNamespace of securityNamespaces.filter(p => p.namespaceId !== undefined).slice(0, maxNumerOfTests)) {
        const securityNamespaceId = securityNamespace.namespaceId!;

        const securityNamespaceForId = await azureDevOpsHelper.securityNamespace(organization, securityNamespaceId);

        if (securityNamespaceForId === undefined) { throw new Error(JSON.stringify({ organization, namespaceId: securityNamespaceId, securityNamespaceForId }, null, 2)); }
    }    
}, 100000);
