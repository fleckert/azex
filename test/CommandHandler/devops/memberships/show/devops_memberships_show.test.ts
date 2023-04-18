import   path                        from "path";
import { AzureDevOpsHelper         } from "../../../../../src/AzureDevOpsHelper";
import { devops_memberships_show   } from "../../../../../src/CommandHandler/devops_memberships_show";
import { TestConfigurationProvider } from "../../../../_Configuration/TestConfiguration";
import { Helper                    } from "../../../../../src/Helper";
import { mkdir                     } from "fs/promises";

test('devops_memberships_show-groups', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;
    const batchSize        = 5;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);
    const projects = await azureDevOpsHelper.projects(organization, maxNumberOfTests)
    const projectNames = projects.filter(p => p.name !== undefined).map(p => p.name!).sort();

    for (const projectName of projectNames) {
        await mkdir(path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), 'groups', 'org'    ), { recursive: true });
        await mkdir(path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), 'groups', 'project'), { recursive: true });

        const pathOutOrg     = path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), 'groups', 'org'    , `devops_memberships_show`);
        const pathOutProject = path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), 'groups', 'project', `devops_memberships_show`);

        const groups = await azureDevOpsHelper.graphGroupsListForProjectName(organization, projectName, maxNumberOfTests);
        const principalNames = groups.filter(p => p.principalName !== undefined).map(p => p.principalName!).sort();

        const batches = Helper.getBatches(principalNames, batchSize);

        for (const batch of batches) {
            const promises = batch.map(principalName => [
                devops_memberships_show.handle(tenant, organization, undefined  , principalName, pathOutOrg    ),
                devops_memberships_show.handle(tenant, organization, projectName, principalName, pathOutProject)
            ]).flat();

            await Promise.all(promises);
        }
    }
}, 10000000);

test('devops_memberships_show-users', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;
    const batchSize        = 5;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);
    const projects = await azureDevOpsHelper.projects(organization, maxNumberOfTests)
    const projectNames = projects.filter(p => p.name !== undefined).map(p => p.name!).sort();

    for (const projectName of projectNames) {
        await mkdir(path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), 'users', 'org'    ), { recursive: true });
        await mkdir(path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), 'users', 'project'), { recursive: true });

        const pathOutOrg     = path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), 'users', 'org'    , `devops_memberships_show`);
        const pathOutProject = path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), 'users', 'project', `devops_memberships_show`);

        const users = await azureDevOpsHelper.graphUsersListForProjectName(organization, projectName, maxNumberOfTests);
        const principalNames = users.filter(p => p.principalName !== undefined).map(p => p.principalName!).sort();

        const batches = Helper.getBatches(principalNames, batchSize);

        for (const batch of batches) {
            const promises = batch.map(principalName => [
                devops_memberships_show.handle(tenant, organization, undefined  , principalName, pathOutOrg    ),
                devops_memberships_show.handle(tenant, organization, projectName, principalName, pathOutProject)
            ]).flat();

            await Promise.all(promises);
        }
    }
}, 10000000);

test('devops_memberships_show-all', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;
    const batchSize        = 5;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);
    const projects = await azureDevOpsHelper.projects(organization, maxNumberOfTests)
    const projectNames = projects.filter(p => p.name !== undefined).map(p => p.name!).sort();

    const parameters = [];

    for (const projectName of projectNames) {
        await mkdir(path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), 'groups', 'org'    ), { recursive: true });
        await mkdir(path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), 'groups', 'project'), { recursive: true });
        await mkdir(path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), 'users' , 'org'    ), { recursive: true });
        await mkdir(path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), 'users' , 'project'), { recursive: true });

        const pathOutGroupsOrg     = path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), 'groups', 'org'    , `devops_memberships_show`);
        const pathOutGroupsProject = path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), 'groups', 'project', `devops_memberships_show`);
        const pathOutUsersOrg      = path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), 'users' , 'org'    , `devops_memberships_show`);
        const pathOutUsersProject  = path.join(__dirname, 'out', organization, projectName.replaceAll(' ', '_'), 'users' , 'project', `devops_memberships_show`);

        const principalNamesUsers  = (await azureDevOpsHelper.graphUsersListForProjectName (organization, projectName, maxNumberOfTests)).filter(p => p.principalName !== undefined).map(p => p.principalName!).sort();
        const principalNamesGroups = (await azureDevOpsHelper.graphGroupsListForProjectName(organization, projectName, maxNumberOfTests)).filter(p => p.principalName !== undefined).map(p => p.principalName!).sort();

        parameters.push(...principalNamesUsers .map(principalName => { return { tenant, organization, projectName: undefined, principalName, pathOut: pathOutUsersOrg      } }));
        parameters.push(...principalNamesUsers .map(principalName => { return { tenant, organization, projectName           , principalName, pathOut: pathOutUsersProject  } }));
        parameters.push(...principalNamesGroups.map(principalName => { return { tenant, organization, projectName: undefined, principalName, pathOut: pathOutGroupsOrg     } }));
        parameters.push(...principalNamesGroups.map(principalName => { return { tenant, organization, projectName           , principalName, pathOut: pathOutGroupsProject } }));
    }

    await Helper.batchCalls(parameters, p => devops_memberships_show.handle(p.tenant, p.organization, p.projectName, p.principalName, p.pathOut), batchSize);
}, 100000000);
