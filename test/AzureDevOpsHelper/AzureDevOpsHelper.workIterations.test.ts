import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { mkdir, rm, writeFile      } from "fs/promises";

test('AzureDevOpsHelper - workIterations', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenant            = config.azureDevOps.tenant;
    const maxNumberOfTests  = config.azureDevOps.maxNumberOfTests;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);
    const testName          = 'workIterations';

    await mkdir(path.join(__dirname, 'out', organization, 'workiteratons'), { recursive: true });

    const fileTeams = path.join(__dirname, 'out', organization, 'workiteratons', `${testName}-${organization}-teams.json`);
    await rm(fileTeams, { force: true });
    const teams = await azureDevOpsHelper.teams(organization);
    await writeFile(fileTeams, JSON.stringify(teams, null, 2));

    for (const team of teams.filter(p => p.id !== undefined && p.projectName !== undefined).slice(0, maxNumberOfTests)) {
        const teamId = team.id!;
        const project = team.projectName!;

        const file = path.join(__dirname, 'out', organization, 'workiteratons', `${testName}-${organization}-${project}-${teamId}-workIterations.json`);
        await rm(file, { force: true });
        const workIterations = await azureDevOpsHelper.workIterations(organization, project, teamId);
        await writeFile(file, JSON.stringify(workIterations, null, 2));
    }
}, 100000);