import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";


test('AzureDevOpsHelper - workBacklogs', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenantId          = config.azureDevOps.tenantId;
    const maxNumberOfTests  = config.azureDevOps.maxNumberOfTests;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const testDir           = 'out';
    const testName          ='workBacklogs';

    await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-teams.json`), JSON.stringify({ message: 'test started' }, null, 2));
    const teams = await azureDevOpsHelper.teams(organization);
    await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-teams.json`), JSON.stringify(teams, null, 2));

    for (const team of teams.filter(p => p.id !== undefined && p.projectName !== undefined).slice(0, maxNumberOfTests)) {
        const teamId = team.id!;
        const project = team.projectName!;

        await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-${project}-${teamId}.json`), JSON.stringify({ message: 'test started' }, null, 2));
        try {
            const workBacklogs = await azureDevOpsHelper.workBacklogs(organization, project, teamId);
            await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-${project}-${teamId}.json`), JSON.stringify(workBacklogs, null, 2));
        } catch (error: any) {
            console.log(error);
            const message: { status?: number } = JSON.parse(error.message)
            if (message.status === 500) {
                // if no areaPath is set for the team/configuration is incorrect/...
                // TF400499: You have not set your team field. Please correct and refresh the page.
            }
            else{
                throw error;
            }
        }
    }
}, 100000);