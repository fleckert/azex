import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsWrapper        } from "../../src/AzureDevOpsWrapper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { rm, writeFile             } from "fs/promises";

test('AzureDevOpsHelper - workTeamSettings', async () => {
    const config = await TestConfigurationProvider.get();
    const organization       = config.azureDevOps.organization;
    const baseUrl            = config.azureDevOps.baseUrl;
    const tenantId           = config.azureDevOps.tenantId;
    const maxNumberOfTests   = 5000??config.azureDevOps.maxNumberOfTests;
    const azureDevOpsWrapper = await AzureDevOpsWrapper.instance(baseUrl, tenantId);
    const azureDevOpsHelper  = await AzureDevOpsHelper.instance(tenantId);
    const testDir            = 'out';
    const testName           = 'workTeamSettings';

    const file = path.join(__dirname, testDir, `${testName}-${organization}-teams.json`);
    await        rm(file, {force: true});
    const teams = await azureDevOpsHelper.teams(organization);
    await writeFile(file, JSON.stringify(teams, null, 2));

    for (const team of teams.filter(p => p.id !== undefined && p.projectId !== undefined).slice(0, maxNumberOfTests)) {
        const teamId    = team.id!;
        const projectId = team.projectId!;

        const fileTeam = path.join(__dirname, testDir, `${testName}-${organization}-${team.projectName ?? projectId}-${team.name ?? teamId}.json`);
        await        rm(fileTeam, {force: true});
        const workTeamSettings = await azureDevOpsWrapper.workTeamSettings(projectId, teamId);
        await writeFile(fileTeam, JSON.stringify({ team, workTeamSettings }, null, 2));
        console.log({fileTeam});
    }
}, 100000);