import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsWrapper         } from "../../src/AzureDevOpsWrapper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper                } from "../_TestHelper/TestHelper";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsHelper - workTeamSettings', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;
    const baseUrl = config.azureDevOps.baseUrl;
    const azureDevOpsWrapper = await AzureDevOpsWrapper.instance(baseUrl);
    const testDir = 'out';
    const testName ='workTeamSettings';

    await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-teams.json`), JSON.stringify({ message: 'test started' }, null, 2));
    const teams = await azureDevOpsHelper.teams(organization);
    await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-teams.json`), JSON.stringify(teams, null, 2));

    const maxNumerOfTests = 10;

    for (const team of teams.filter(p => p.id !== undefined && p.projectId !== undefined).slice(0, maxNumerOfTests)) {
        const teamId    = team.id!;
        const projectId = team.projectId!;

        await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-${projectId}-${teamId}.json`), JSON.stringify({ message: 'test started' }, null, 2));
        const workTeamSettings = await azureDevOpsWrapper.workTeamSettings(projectId, teamId);
        await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-${projectId}-${teamId}.json`), JSON.stringify({ team, workTeamSettings }, null, 2));
    }
}, 100000);