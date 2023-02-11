import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { appendFile, writeFile     } from "fs/promises";
import { TestHelper                } from "../_TestHelper/TestHelper";

test('AzureDevOpsHelper - workBacklogs', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;
    const testDir = 'out';
    const testName ='workBacklogs';

    await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-teams.json`), JSON.stringify({ message: 'test started' }, null, 2));
    const teams = await azureDevOpsHelper.teams(organization);
    await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-teams.json`), JSON.stringify(teams, null, 2));
    TestHelper.checkValueAndError(teams, { organization });


    const maxNumerOfTests = 5;

    for (const team of teams.value!.filter(p => p.id !== undefined && p.projectName !== undefined).slice(0, maxNumerOfTests)) {
        const teamId = team.id!;
        const project = team.projectName!;

        await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-${project}-${teamId}.json`), JSON.stringify({ message: 'test started' }, null, 2));
        const workBacklogs = await azureDevOpsHelper.workBacklogs(organization, project, teamId);
        await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-${project}-${teamId}.json`), JSON.stringify(workBacklogs, null, 2));
        TestHelper.checkValueAndError(workBacklogs, { organization, project, teamId });
    }
}, 100000);