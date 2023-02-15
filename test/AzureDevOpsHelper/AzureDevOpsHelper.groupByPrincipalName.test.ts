import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsHelper - groupByPrincipalName', async () => {
    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenantId = config.azureDevOps.tenantId;
    const testDir = 'out';
    const testName ='groupByPrincipalName';
    const azureDevOpsHelper = new AzureDevOpsHelper(tenantId);

    await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-groups.json`), JSON.stringify({ message: 'test started' }, null, 2));
    const groups = await azureDevOpsHelper.graphGroupsList(organization);
    await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-groups.json`), JSON.stringify(groups, null, 2));

    const maxNumerOfTests = 5;

    for (const graphGroup of groups.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphGroup.principalName!;

        const graphSubject = await azureDevOpsHelper.groupByPrincipalName(organization, principalName);
        if (graphSubject === undefined) { throw new Error(JSON.stringify({ organization, principalName })); }
    }

    const principalName = "does-not-exist";
    const graphSubject = await azureDevOpsHelper.groupByPrincipalName(organization, principalName);
    if (graphSubject !== undefined) { throw new Error(JSON.stringify({ organization, principalName, graphSubject })); }
}, 100000);