import   path                        from "path";
import { AzureDevOpsHelper         } from "../../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../../_Configuration/TestConfiguration";
import { mkdir, rm, writeFile      } from "fs/promises";

test('AzureDevOpsHelper - userEntitlements', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenantId         = config.azureDevOps.tenantId;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;

    await mkdir(path.join(__dirname, 'out'), { recursive: true });

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const users = await azureDevOpsHelper.graphUsersList(organization, maxNumberOfTests);

    const files = new Array<string>();

    for (const user of users.filter(p => p.descriptor !== undefined)) {
        const file = path.join(__dirname, 'out', `userEntitlements-${organization}-${user.principalName}.json`);
        await rm(file, { force: true });

        const userEntitlements = await azureDevOpsHelper.userEntitlements(organization, user.descriptor!);

        await writeFile(file, JSON.stringify(userEntitlements, null, 2));
        files.push(file);
    }

    console.log({ files });
}, 100000);
