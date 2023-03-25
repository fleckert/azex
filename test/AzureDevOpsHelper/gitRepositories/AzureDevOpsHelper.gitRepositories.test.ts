import   path                        from "path";
import { AzureDevOpsHelper         } from "../../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../../_Configuration/TestConfiguration";
import { mkdir, rm, writeFile      } from "fs/promises";

test('AzureDevOpsHelper - gitRepositories', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const projectName       = config.azureDevOps.projectName;
    const tenant            = config.azureDevOps.tenant;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    await mkdir(path.join(__dirname, 'out', organization), { recursive: true });
    const file = path.join(__dirname, 'out', organization, `${organization}-${projectName}-gitRepositories`.replaceAll(new RegExp('[^a-zA-Z0-9_]', 'g'), '_').replaceAll('__', '_') + '.json');
    await rm(file, { force: true });
    const gitRepositories = await azureDevOpsHelper.gitRepositories(organization, projectName);
    await writeFile(file, JSON.stringify(gitRepositories, null, 2));

    console.log({ file });
}, 200000);

test('AzureDevOpsHelper - gitRepositories - all', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenant            = config.azureDevOps.tenant;
    const maxNumberOfTests  = config.azureDevOps.maxNumberOfTests;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    const projects = await azureDevOpsHelper.projects(organization, maxNumberOfTests);

    for (const project of projects.filter(p => p.name !== undefined)) {
        const projectName = project.name!;
        await mkdir(path.join(__dirname, 'out', organization), { recursive: true });
        const file = path.join(__dirname, 'out', organization, `${organization}-${project.name}-gitRepositories`.replaceAll(new RegExp('[^a-zA-Z0-9_]', 'g'), '_').replaceAll('__', '_') + '.json');
        await rm(file, { force: true });
        const gitRepositories = await azureDevOpsHelper.gitRepositories(organization, projectName);
        await writeFile(file, JSON.stringify(gitRepositories, null, 2));

        console.log({ file });
    }
}, 200000);
