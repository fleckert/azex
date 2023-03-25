import   path                        from "path";
import { AzureDevOpsHelper         } from "../../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../../_Configuration/TestConfiguration";
import { mkdir, rm, writeFile      } from "fs/promises";

test('AzureDevOpsHelper-dashboards', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const projectName  = config.azureDevOps.projectName;
    const tenant       = config.azureDevOps.tenant;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    await testRun(azureDevOpsHelper, organization,projectName);
}, 200000);

test('AzureDevOpsHelper-dashboards-all', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    const projects = await azureDevOpsHelper.projects(organization, maxNumberOfTests);

    for (const project of projects.filter(p => p.name !== undefined)) {
        await testRun(azureDevOpsHelper, organization,project.name!);
    }
}, 200000);

const testRun = async (azureDevOpsHelper: AzureDevOpsHelper, organization: string, projectName: string) => {
    const project = await azureDevOpsHelper.project(organization, projectName);
    if (project?.id === undefined) {
        throw new Error(JSON.stringify({ organization, projectName, project, message: 'Failed to resovle project.id' }));
    }

    const teams = await azureDevOpsHelper.teamsInProject(organization, project?.id);

    await mkdir(path.join(__dirname, 'out', organization, projectName), { recursive: true });

    for (const team of teams.filter(p => p.id !== undefined)) {
        const file = path.join(__dirname, 'out', organization, projectName, `${organization}-${projectName}-${team.name}-dashboards`.replaceAll(new RegExp('[^a-zA-Z0-9_]', 'g'), '_').replaceAll('__', '_') + '.json');
        await rm(file, { force: true });
        const dashboards = await azureDevOpsHelper.dashboards(organization, projectName, team.id!);
        await writeFile(file, JSON.stringify(dashboards, null, 2));

        console.log({ file });
    }

    const file = path.join(__dirname, 'out', organization, projectName, `${organization}-${projectName}-project-dashboards`.replaceAll(new RegExp('[^a-zA-Z0-9_]', 'g'), '_').replaceAll('__', '_') + '.json');
    await rm(file, { force: true });
    const dashboards = await azureDevOpsHelper.dashboards(organization, projectName);
    await writeFile(file, JSON.stringify(dashboards, null, 2));

    console.log({ file });
}
