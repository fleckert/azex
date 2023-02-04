import   path                        from "path";
import { devops_permissions_show   } from "../../../../src/CommandHandler/devops_permissions_show";
import { AzureDevOpsHelper         } from "../../../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../../../_Configuration/TestConfiguration";

test('devops_permissions_show-user-project', async () => {
    const config      = await TestConfigurationProvider.get();
    const pathOut     = path.join(__dirname, 'out', `azex-test-devops-permissions-show`);

    const azureDevOpsHelper = new AzureDevOpsHelper();

    const users = await azureDevOpsHelper.graphUsersList(config.azureDevOps.organization);
    if (users.error !== undefined) { throw users.error; }
    if (users.value === undefined) { throw new Error("users.value === undefined"); }

    const maxNumerOfTests = 5;

    for (const graphUser of users.value.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphUser.principalName!;

        await devops_permissions_show.handle(config.azureDevOps.organization, config.azureDevOps.projectName, principalName, pathOut);
    }
}, 100000);

test('devops_permissions_show-user-collection', async () => {
    const config      = await TestConfigurationProvider.get();
    const pathOut     = path.join(__dirname, 'out', `azex-test-devops-permissions-show`);

    const azureDevOpsHelper = new AzureDevOpsHelper();

    const users = await azureDevOpsHelper.graphUsersList(config.azureDevOps.organization);
    if (users.error !== undefined) { throw users.error; }
    if (users.value === undefined) { throw new Error("users.value === undefined"); }

    const maxNumerOfTests = 5;

    for (const graphUser of users.value.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphUser.principalName!;

        await devops_permissions_show.handle(config.azureDevOps.organization, undefined, principalName, pathOut);
    }
}, 300000);

test('devops_permissions_show-group-project', async () => {
    const config      = await TestConfigurationProvider.get();
    const pathOut     = path.join(__dirname, 'out', `azex-test-devops-permissions-show`);

    const azureDevOpsHelper = new AzureDevOpsHelper();

    const groups = await azureDevOpsHelper.graphGroupsList(config.azureDevOps.organization);
    if (groups.error !== undefined) { throw groups.error; }
    if (groups.value === undefined) { throw new Error("groups.value === undefined"); }

    const maxNumerOfTests = 5;

    for (const graphUser of groups.value.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphUser.principalName!;

        await devops_permissions_show.handle(config.azureDevOps.organization, config.azureDevOps.projectName, principalName, pathOut);
    }
}, 100000);


test('devops_permissions_show-group-collection', async () => {
    const config      = await TestConfigurationProvider.get();
    const pathOut     = path.join(__dirname, 'out', `azex-test-devops-permissions-show`);

    const azureDevOpsHelper = new AzureDevOpsHelper();

    const groups = await azureDevOpsHelper.graphGroupsList(config.azureDevOps.organization);
    if (groups.error !== undefined) { throw groups.error; }
    if (groups.value === undefined) { throw new Error("groups.value === undefined"); }

    const maxNumerOfTests = 5;

    for (const graphUser of groups.value.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphUser.principalName!;

        await devops_permissions_show.handle(config.azureDevOps.organization, undefined, principalName, pathOut);
    }
}, 100000);

test('devops_permissions_show-nonExistent', async () => {
    const config = await TestConfigurationProvider.get();
    const pathOut = path.join(__dirname, 'out', `azex-test-devops-permissions-show`);

    const principalName = "does-not-exist";
    try {
        await devops_permissions_show.handle(config.azureDevOps.organization, config.azureDevOps.projectName, principalName, pathOut);
        throw new Error(`An expected exception was not raised for 'devops_permissions_show.handle(${config.azureDevOps.organization}, ${config.azureDevOps.projectName}, ${principalName}, ${pathOut})'.`);
    }
    catch { }
}, 100000);