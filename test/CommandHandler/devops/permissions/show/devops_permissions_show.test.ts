import path from "path";
import { devops_permissions_show   } from "../../../../../src/CommandHandler/devops_permissions_show";
import { AzureDevOpsHelper         } from "../../../../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../../../../_Configuration/TestConfiguration";

test('devops_permissions_show-user-project', async () => {
    const config            = await TestConfigurationProvider.get();
    const pathOut           = path.join(__dirname, 'out', 'devops_permissions_show-user-project');
    const organization      = config.azureDevOps.organization;
    const projectName       = config.azureDevOps.projectName;
    const tenantId          = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const maxNumerOfTests   = 5;

    const collection = await azureDevOpsHelper.graphUsersList(organization);

    for (const graphUser of collection.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphUser.principalName!;

        await devops_permissions_show.handle(tenantId, organization, projectName, principalName, pathOut);
    }
}, 100000);

test('devops_permissions_show-user-collection', async () => {
    const config            = await TestConfigurationProvider.get();
    const pathOut           = path.join(__dirname, 'out', `devops_permissions_show-user-collection`);
    const organization      = config.azureDevOps.organization;
    const projectName       = undefined;
    const tenantId          = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const maxNumerOfTests   = 5;

    const collection = await azureDevOpsHelper.graphUsersList(organization);

    for (const item of collection.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = item.principalName!;

        await devops_permissions_show.handle(tenantId, organization, projectName, principalName, pathOut);
    }
}, 300000);

test('devops_permissions_show-group-project', async () => {
    const config            = await TestConfigurationProvider.get();
    const pathOut           = path.join(__dirname, 'out', `devops_permissions_show-group-project`);
    const organization      = config.azureDevOps.organization;
    const projectName       = config.azureDevOps.projectName;
    const tenantId          = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const maxNumerOfTests   = 5;

    const collection = await azureDevOpsHelper.graphGroupsList(organization);

    for (const item of collection.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = item.principalName!;

        await devops_permissions_show.handle(tenantId, organization, projectName, principalName, pathOut);
    }
}, 100000);


test('devops_permissions_show-group-collection', async () => {
    const config            = await TestConfigurationProvider.get();
    const pathOut           = path.join(__dirname, 'out', `devops_permissions_show-group-collection`);
    const organization      = config.azureDevOps.organization;
    const tenantId          = config.azureDevOps.tenantId;
    const projectName       = undefined;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const maxNumerOfTests   = 5;

    const collection = await azureDevOpsHelper.graphGroupsList(organization);

    for (const item of collection.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = item.principalName!;

        await devops_permissions_show.handle(tenantId, organization, projectName, principalName, pathOut);
    }
}, 100000);

test('devops_permissions_show-nonExistent', async () => {
    const config        = await TestConfigurationProvider.get();
    const pathOut       = path.join(__dirname, 'out', `devops_permissions_show-nonExistent`);
    const organization  = config.azureDevOps.organization;
    const tenantId      = config.azureDevOps.tenantId;
    const projectName   = config.azureDevOps.projectName;
    const principalName = "does-not-exist";

    try {
        await devops_permissions_show.handle(tenantId, organization, projectName, principalName, pathOut);
        throw new Error(`An expected exception was not raised for 'devops_permissions_show.handle(${organization}, ${projectName}, ${principalName}, ${pathOut})'.`);
    }
    catch { }
}, 100000);