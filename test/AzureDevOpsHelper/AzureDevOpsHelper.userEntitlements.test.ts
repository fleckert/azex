import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsHelper - userEntitlements', async () => {

    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenantId = config.azureDevOps.tenantId;
    const azureDevOpsHelper = new AzureDevOpsHelper(tenantId);

    const users = await azureDevOpsHelper.graphUsersList(organization);

    const maxNumerOfTests = 5;

    const files = new Array<string>();
    const testName ='userEntitlements';
    for (const user of users.filter(p => p.descriptor !== undefined).slice(0, maxNumerOfTests)) {
        const file = path.join(__dirname, 'out', `${testName}-${organization}-${user.principalName}.json`);
        await writeFile(file, JSON.stringify({ message: 'test started' }, null, 2));

        const userEntitlements = await azureDevOpsHelper.userEntitlements(organization, user.descriptor!);

        await writeFile(file, JSON.stringify(userEntitlements, null, 2));

        files.push(file);
    }

    console.log({ files });
}, 100000);
