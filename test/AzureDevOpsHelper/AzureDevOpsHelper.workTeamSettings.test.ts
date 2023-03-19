import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsWrapper        } from "../../src/AzureDevOpsWrapper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { mkdir, rm, writeFile      } from "fs/promises";

test('AzureDevOpsHelper - workTeamSettings', async () => {
    const config = await TestConfigurationProvider.get();
    const organization       = config.azureDevOps.organization;
    const baseUrl            = config.azureDevOps.baseUrl;
    const tenant             = config.azureDevOps.tenant;
    const maxNumberOfTests   = 5000??config.azureDevOps.maxNumberOfTests;
    const azureDevOpsWrapper = await AzureDevOpsWrapper.instance(baseUrl, tenant);
    const azureDevOpsHelper  = await AzureDevOpsHelper.instance(tenant);
    const testDir            = 'out';
    const testName           = 'workTeamSettings';

    await mkdir(path.join(__dirname, 'out', organization, testName), { recursive: true });

    const teams = await azureDevOpsHelper.teams(organization);

    for (const team of teams.filter(p => p.id !== undefined && p.projectId !== undefined).slice(0, maxNumberOfTests)) {
        const teamId = team.id!;
        const projectId = team.projectId!;

        const file = path.join(__dirname, 'out', organization, testName, `${testName}-${organization}-${team.projectName ?? projectId}-${team.name ?? teamId}.json`);
        await rm(file, { force: true });
        const workTeamSettings = await azureDevOpsWrapper.workTeamSettings(projectId, teamId);
        await writeFile(file, JSON.stringify({ team, workTeamSettings }, null, 2));
        console.log({ fileTeam: file });
    }
}, 100000);