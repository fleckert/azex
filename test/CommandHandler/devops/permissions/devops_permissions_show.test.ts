import path from "path";
import { devops_permissions_show   } from "../../../../src/CommandHandler/devops_permissions_show";
import { AzureDevOpsHelper         } from "../../../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../../../_Configuration/TestConfiguration";
import { TestHelper                } from "../../../_TestHelper/TestHelper";

test('devops_permissions_show-user-project', async () => {
    const config            = await TestConfigurationProvider.get();
    const pathOut           = path.join(__dirname, 'out', 'devops_permissions_show-user-project');
    const organization      = config.azureDevOps.organization;
    const project           = config.azureDevOps.projectName;
    const azureDevOpsHelper = new AzureDevOpsHelper();

    const users = await azureDevOpsHelper.graphUsersList(organization);
    TestHelper.checkValueAndError(users, { organization });

    const maxNumerOfTests = 5;

    for (const graphUser of users.value!.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphUser.principalName!;

        await devops_permissions_show.handle(organization, project, principalName, pathOut);
    }
}, 100000);

test('devops_permissions_show-user-collection', async () => {
    const config            = await TestConfigurationProvider.get();
    const pathOut           = path.join(__dirname, 'out', `devops_permissions_show-user-collection`);
    const organization      = config.azureDevOps.organization;
    const azureDevOpsHelper = new AzureDevOpsHelper();

    const users = await azureDevOpsHelper.graphUsersList(organization);
    TestHelper.checkValueAndError(users, { organization });

    const maxNumerOfTests = 5;

    for (const graphUser of users.value!.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphUser.principalName!;

        await devops_permissions_show.handle(config.azureDevOps.organization, undefined, principalName, pathOut);
    }
}, 300000);

test('devops_permissions_show-group-project', async () => {
    const config            = await TestConfigurationProvider.get();
    const pathOut           = path.join(__dirname, 'out', `devops_permissions_show-group-project`);
    const organization      = config.azureDevOps.organization;
    const azureDevOpsHelper = new AzureDevOpsHelper();

    const groups = await azureDevOpsHelper.graphGroupsList(organization);
    TestHelper.checkValueAndError(groups, { organization });

    const maxNumerOfTests = 5;

    for (const graphUser of groups.value!.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphUser.principalName!;

        await devops_permissions_show.handle(config.azureDevOps.organization, config.azureDevOps.projectName, principalName, pathOut);
    }
}, 100000);


test('devops_permissions_show-group-collection', async () => {
    const config            = await TestConfigurationProvider.get();
    const pathOut           = path.join(__dirname, 'out', `devops_permissions_show-group-collection`);
    const organization      = config.azureDevOps.organization;
    const azureDevOpsHelper = new AzureDevOpsHelper();

    const groups = await azureDevOpsHelper.graphGroupsList(organization);
    TestHelper.checkValueAndError(groups, { organization });

    const maxNumerOfTests = 5;

    for (const graphUser of groups.value!.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphUser.principalName!;

        await devops_permissions_show.handle(organization, undefined, principalName, pathOut);
    }
}, 100000);

test('devops_permissions_show-nonExistent', async () => {
    const config        = await TestConfigurationProvider.get();
    const pathOut       = path.join(__dirname, 'out', `devops_permissions_show-nonExistent`);
    const organization  = config.azureDevOps.organization;
    const project       = config.azureDevOps.projectName;
    const principalName = "does-not-exist";

    try {
        await devops_permissions_show.handle(organization, project, principalName, pathOut);
        throw new Error(`An expected exception was not raised for 'devops_permissions_show.handle(${organization}, ${project}, ${principalName}, ${pathOut})'.`);
    }
    catch { }
}, 100000);