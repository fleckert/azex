import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper                } from "../_TestHelper/TestHelper";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsHelper - workTeamSettings', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;
    const testDir = 'out';
    const testName ='workTeamSettings';

    await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-teams.json`), JSON.stringify({ message: 'test started' }, null, 2));
    const teams = await azureDevOpsHelper.teams(organization);
    await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-teams.json`), JSON.stringify(teams, null, 2));
    TestHelper.checkValueAndError(teams, { organization });

    const maxNumerOfTests = 10;

    for (const team of teams.value!.filter(p => p.id !== undefined && p.projectName !== undefined).slice(0, maxNumerOfTests)) {
        const teamId = team.id!;
        const project = team.projectName!;

        await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-${project}-${teamId}.json`), JSON.stringify({ message: 'test started' }, null, 2));
        const workTeamSettings = await azureDevOpsHelper.workTeamSettings(organization, project, teamId);
        await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-${project}-${teamId}.json`), JSON.stringify(workTeamSettings, null, 2));
        TestHelper.checkValueAndError(workTeamSettings, { organization, project, teamId });
    }
}, 100000);