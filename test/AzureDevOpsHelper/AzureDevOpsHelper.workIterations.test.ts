import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { appendFile, writeFile     } from "fs/promises";
import { TestHelper } from "../_TestHelper/TestHelper";

test('AzureDevOpsHelper - workIterations', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;
    const testDir = 'out';
    const testName ='workIterations';

    await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-teams.json`), JSON.stringify({ message: 'test started' }, null, 2));
    const teams = await azureDevOpsHelper.teams(organization);
    await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-teams.json`), JSON.stringify(teams, null, 2));

    const maxNumerOfTests = 10;

    for (const team of teams.filter(p => p.id !== undefined && p.projectName !== undefined).slice(0, maxNumerOfTests)) {
        const teamId = team.id!;
        const project = team.projectName!;

        await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-${project}-${teamId}-workIterations.json`), JSON.stringify({ message: 'test started' }, null, 2));
        const workIterations = await azureDevOpsHelper.workIterations(organization, project, teamId);
        await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-${project}-${teamId}-workIterations.json`), JSON.stringify(workIterations, null, 2));

        for (const workIteration of workIterations.slice(0, maxNumerOfTests)) {
            if (workIteration.path === undefined) { throw new Error(`workIteration.path === undefined ${JSON.stringify({ organization, project, team, workIteration })}`); }

            await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-${project}-${teamId}-workIteration-${workIteration.id}.json`), JSON.stringify({ message: 'test started' }, null, 2));
            const workIterationResponse = await azureDevOpsHelper.workIteration(organization, project, teamId, workIteration.path);
            await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-${project}-${teamId}-workIteration-${workIteration.id}.json`), JSON.stringify(workIterationResponse, null, 2));
        }
    }
}, 100000);