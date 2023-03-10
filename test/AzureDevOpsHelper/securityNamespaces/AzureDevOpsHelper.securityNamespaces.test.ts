import   path                        from "path";
import { AzureDevOpsHelper         } from "../../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../../_Configuration/TestConfiguration";
import { mkdir, rm, writeFile      } from "fs/promises";

test('AzureDevOpsHelper - securityNamespaces', async () => {
    const config            = await TestConfigurationProvider.get();
    const tenantId          = config.azureDevOps.tenantId;
    const organization      = config.azureDevOps.organization;
    const maxNumberOfTests  = config.azureDevOps.maxNumberOfTests;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

    await mkdir(path.join(__dirname, 'out'), { recursive: true });
    const file = path.join(__dirname, 'out', `securityNamespaces-${organization}.json`);
    await rm(file, { force: true });

    const securityNamespaces = await azureDevOpsHelper.securityNamespaces(organization);

    await writeFile(file, JSON.stringify(securityNamespaces, null, 2));
    console.log(file);

    for (const securityNamespace of securityNamespaces.filter(p => p.namespaceId !== undefined).slice(0, maxNumberOfTests)) {
        const securityNamespaceId = securityNamespace.namespaceId!;

        const securityNamespaceForId = await azureDevOpsHelper.securityNamespace(organization, securityNamespaceId);

        if (securityNamespaceForId === undefined) { throw new Error(JSON.stringify({ organization, namespaceId: securityNamespaceId, securityNamespaceForId }, null, 2)); }
    }    
}, 100000);
