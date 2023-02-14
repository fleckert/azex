import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsHelper - userEntitlements', async () => {

    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;

    const users = await azureDevOpsHelper.graphUsersList(organization);
    if (users.error !== undefined) { throw users.error; }
    if (users.value === undefined) { throw new Error("users.value === undefined"); }

    const maxNumerOfTests = 5;

    for (const user of users.value.filter(p => p.descriptor !== undefined).slice(0, maxNumerOfTests)) {
        const file = path.join(__dirname, 'out', `test-userEntitlements-${organization}-${user.principalName}.json`);
        await writeFile(file, JSON.stringify({ message: 'test started' }, null, 2));

        const userEntitlements = await azureDevOpsHelper.userEntitlements(organization, user.descriptor!);
        if (userEntitlements.error !== undefined) { throw users.error; }
        if (userEntitlements.value === undefined) { throw new Error("userEntitlements.value === undefined"); }

        await writeFile(file, JSON.stringify(userEntitlements.value, null, 2));
    }


    // await writeFile(file+'table.md', lines.join('\n'));

    // await writeFile(file + '.md', users.value.filter(p => Guid.isGuid(p.principalName) === false).map(p => `|${p.displayName}||${p.principalName}||\n`));
}, 100000);