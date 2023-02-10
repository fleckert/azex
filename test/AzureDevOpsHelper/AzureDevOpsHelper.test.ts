import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsSecurityTokens } from "../../src/AzureDevOpsSecurityTokens";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";
import { GraphGroup, GraphUser     } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Guid                      } from "../../src/Guid";

test('AzureDevOpsHelper - graphUsersList', async () => {

    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;

    const file = path.join(__dirname, 'out', `test-graphUsersList-${organization}.json`);
    await writeFile(file, JSON.stringify({ message: 'test started' }, null, 2));

    const users = await azureDevOpsHelper.graphUsersList(organization);
    if (users.error !== undefined) { throw users.error; }
    if (users.value === undefined) { throw new Error("users.value === undefined"); }
    await writeFile(file, JSON.stringify(users.value, null, 2));

    users.value.sort((a: GraphUser, b: GraphUser) => `${a.displayName}`.localeCompare(`${b.displayName}`));

    const groups = await azureDevOpsHelper.graphGroupsList(organization);
    if (groups.error !== undefined) { throw users.error; }
    if (groups.value === undefined) { throw new Error("groups.value === undefined"); }

    const usersGroups = new Array<{ user: GraphUser, groups: Array<GraphGroup> }>
    for (const user of users.value.slice(0, 500)) { //todo
        if (Guid.isGuid(user.principalName)) {
            // skip the build in accounts
            continue;
        }
        if (user.descriptor === undefined) {
            continue;
        }
        const memberships = await azureDevOpsHelper.graphMembershipsList(organization, user.descriptor, 'up');
        if (memberships.error !== undefined) { throw memberships.error; }
        if (memberships.value === undefined) { throw new Error(`memberships.value === undefined`); }

        const userGroups = { user, groups: new Array<GraphGroup>() };
        for (const membership of memberships.value) {
            const group = groups.value.find(p => p.descriptor === membership.containerDescriptor);
            if (group !== undefined) {
                userGroups.groups.push(group);
            }
        }
        usersGroups.push(userGroups);
    }

    const getProjectNameFromGroup = (grp: GraphGroup): string => { return `${grp.principalName}`.split('\\')[0]?.replaceAll('[', '').replaceAll(']', '') }
    const sortUsersGroupsFlat = (a: { user: { displayName: string | undefined } }, b: { user: { displayName: string | undefined } }) => `${a.user.displayName?.toLowerCase()}`.localeCompare(`${b.user.displayName?.toLowerCase()}`)

    const usersGroupsFlat = usersGroups.map(userGroups => {
        return {
            user: {
                principalName: userGroups.user.principalName,
                displayName: userGroups.user.displayName
            },
            projects: [...new Set<string>(userGroups.groups.map(getProjectNameFromGroup))]
        }
    });

    usersGroupsFlat.sort(sortUsersGroupsFlat);

    const distinctProjects = new Set<string>();
    for (const userGroupsFlat of usersGroupsFlat) {
        for (const project of userGroupsFlat.projects) {
            distinctProjects.add(project);
        }
    }
    const distinctProjectsSorted = [...distinctProjects];
    distinctProjectsSorted.sort();

    const organizationFromProjects = distinctProjectsSorted.find(p => p.toLowerCase() === config.azureDevOps.organization.toLowerCase());
    const projectsWithoutOrganization = distinctProjectsSorted.filter(p => p.toLowerCase() !== config.azureDevOps.organization.toLowerCase());
    const distinctProjectsSortedWithorganizationFirst = [organizationFromProjects, ...projectsWithoutOrganization];
    const lines = new Array<string>();
    lines.push(`||${  distinctProjectsSortedWithorganizationFirst.map(p => `${p}|`).join('')}`);
    lines.push(`|:-|${distinctProjectsSortedWithorganizationFirst.map(p => ':-:|' ).join('')}` );
    for (const userGroupsFlat of usersGroupsFlat) {
        const line = Array<string | undefined>();
        line.push(`[${userGroupsFlat.user.displayName}](${userGroupsFlat.user.principalName})`);
        for (const project of distinctProjectsSortedWithorganizationFirst) {
            line.push(
                userGroupsFlat.projects.find(p => p === project) === undefined
                    ? undefined
                    : 'x'
            );
        }
        lines.push(`|${line.join('|')}|`);
    }

    await writeFile(file+'table.md', lines.join('\n'));
    
    // await writeFile(file + '.md', users.value.filter(p => Guid.isGuid(p.principalName) === false).map(p => `|${p.displayName}||${p.principalName}||\n`));
}, 100000);

test('AzureDevOpsHelper - userEntitlements', async () => {

    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;

    const users = await azureDevOpsHelper.graphUsersList(organization);
    if (users.error !== undefined) { throw users.error; }
    if (users.value === undefined) { throw new Error("users.value === undefined"); }
    
    const maxNumerOfTests = 5;

    for (const user of users.value.filter(p => p.descriptor !== undefined).slice(0, maxNumerOfTests)) {
        const file = path.join(__dirname, 'out', `test-userEntitlements-${organization}-${user.principalName}.json`);
        await writeFile(file, JSON.stringify({ message: 'test started' }, null, 2));
       
        const userEntitlements = await azureDevOpsHelper.userEntitlements(organization, user.descriptor!);
        if (userEntitlements.error !== undefined) { throw users.error; }
        if (userEntitlements.value === undefined) { throw new Error("userEntitlements.value === undefined"); }

        await writeFile(file, JSON.stringify(userEntitlements.value , null, 2));
    }
  

    // await writeFile(file+'table.md', lines.join('\n'));
    
    // await writeFile(file + '.md', users.value.filter(p => Guid.isGuid(p.principalName) === false).map(p => `|${p.displayName}||${p.principalName}||\n`));
}, 100000);

test('AzureDevOpsHelper - userByPrincipalName', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();

    const users = await azureDevOpsHelper.graphUsersList(config.azureDevOps.organization);
    if (users.error !== undefined) { throw users.error; }
    if (users.value === undefined) { throw new Error("users.value === undefined"); }

    const maxNumerOfTests = 5;

    for (const graphUser of users.value.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphUser.principalName!;

        const graphSubject = await azureDevOpsHelper.userByPrincipalName(config.azureDevOps.organization, principalName);
        if (graphSubject.error !== undefined) { throw graphSubject.error; }
        if (graphSubject.value === undefined) { throw new Error(`Failed to resolve user for organization[${config.azureDevOps.organization}] principalName[${principalName}].`); }
    }

    const principalName = "does-not-exist";
    const graphSubject = await azureDevOpsHelper.userByPrincipalName(config.azureDevOps.organization, principalName);
    if (graphSubject.error !== undefined) { throw graphSubject.error; }
    if (graphSubject.value !== undefined) { throw new Error(`Resolved non-existent user for organization[${config.azureDevOps.organization}] principalName[${principalName}].`); }
}, 100000);

test('AzureDevOpsHelper - identityByDescriptor', async () => {
    
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;

    const file = path.join(__dirname, 'out', `test-graphUsersList-${organization}.json`);
    await writeFile(file, JSON.stringify({ message: 'test started' }, null, 2));

    const users = await azureDevOpsHelper.graphUsersList(organization);
    if (users.error !== undefined) { throw users.error; }
    if (users.value === undefined) { throw new Error("users.value === undefined"); }

    for (const user of users.value) {
        if (user.descriptor !== undefined) {
            const identity = await azureDevOpsHelper.identityByDescriptor(organization, user.descriptor)
            if (identity.error !== undefined) { throw users.error; }
            if (identity.value === undefined) { throw new Error("identity.value === undefined"); }
        }
    }
}, 100000);

test('AzureDevOpsHelper - groupByPrincipalName', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();

    const groups = await azureDevOpsHelper.graphGroupsList(config.azureDevOps.organization);
    if (groups.error !== undefined) { throw groups.error; }
    if (groups.value === undefined) { throw new Error("groups.value === undefined"); }

    const maxNumerOfTests = 5;

    for (const graphGroup of groups.value.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphGroup.principalName!;

        const graphSubject = await azureDevOpsHelper.groupByPrincipalName(config.azureDevOps.organization, principalName);
        if (graphSubject.error !== undefined) { throw graphSubject.error; }
        if (graphSubject.value === undefined) { throw new Error(`Failed to resolve group for organization[${config.azureDevOps.organization}] principalName[${principalName}].`); }
    }

    const principalName = "does-not-exist";
    const graphSubject = await azureDevOpsHelper.groupByPrincipalName(config.azureDevOps.organization, principalName);
    if (graphSubject.error !== undefined) { throw graphSubject.error; }
    if (graphSubject.value !== undefined) { throw new Error(`Resolved non-existent group for organization[${config.azureDevOps.organization}] principalName[${principalName}].`); }
}, 100000);

test('AzureDevOpsHelper - securityNamespaces', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;

    const securityNamespaces = await azureDevOpsHelper.securityNamespaces(organization);
    if (securityNamespaces.error !== undefined) { throw securityNamespaces.error; }
    if (securityNamespaces.value === undefined) { throw new Error(`securityNamespaces(${organization}).value === undefined`); }

    const maxNumerOfTests = 5;

    for (const securityNamespace of securityNamespaces.value.filter(p => p.namespaceId !== undefined).slice(0, maxNumerOfTests)) {
        const namespaceId = securityNamespace.namespaceId!;

        const securityNamespaceForId = await azureDevOpsHelper.securityNamespace(organization, namespaceId);
        if (securityNamespaceForId.error !== undefined) { throw securityNamespaceForId.error; }
        if (securityNamespaceForId.value === undefined) { throw new Error(`securityNamespaces(${organization}, ${namespaceId}).value === undefined`); }
    }
}, 100000);

test('AzureDevOpsHelper - identitiesByDescriptors', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;

    const securityNamespaces = await azureDevOpsHelper.securityNamespaces(organization);
    if (securityNamespaces.error !== undefined) { throw securityNamespaces.error; }
    if (securityNamespaces.value === undefined) { throw new Error(`securityNamespaces(${organization}).value === undefined`); }

    const maxNumerOfTests = 5;

    for (const securityNamespace of securityNamespaces.value.filter(p => p.namespaceId !== undefined).slice(0, maxNumerOfTests)) {
        const securityNamespaceId = securityNamespace.namespaceId!;

        const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId });
        if (accessControlLists.error !== undefined) { throw accessControlLists.error; }
        if (accessControlLists.value === undefined) { throw new Error(`accessControlLists(${organization}, ${securityNamespaceId}).value === undefined`); }

        for (const accessControlList of accessControlLists.value) {
            for (const descriptor in accessControlList.acesDictionary) {
                const identities = await azureDevOpsHelper.identitiesByDescriptors(organization, [descriptor]);
                if (identities.error !== undefined) { throw identities.error; }
                if (identities.value === undefined) { throw new Error(`identitiesByDescriptors(${organization}, [${descriptor}]).value === undefined`); }
                if (identities.value.length !== 1) { throw new Error(`identitiesByDescriptors(${organization}, [${descriptor}]) returns ${identities.value.length} items.`) }

                const identity = await azureDevOpsHelper.identityByDescriptor(organization, descriptor);
                if (identity.error !== undefined) { throw identity.error; }
                if (identity.value === undefined) { throw new Error(`identityByDescriptor(${organization}, [${descriptor}]).value === undefined`); }
            }
        }
    }
}, 100000);

test('AzureDevOpsHelper - gitRepositories', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;
    const projectName  = config.azureDevOps.projectName;

    const gitRepositories = await azureDevOpsHelper.gitRepositories(organization, projectName);
    if (gitRepositories.error !== undefined) { throw gitRepositories.error; }
    if (gitRepositories.value === undefined) { throw new Error(`gitRepositories(${organization}, ${projectName}).value === undefined`); }

    const securityNamespace = await azureDevOpsHelper.securityNamespaceByName(organization, 'Git Repositories')
    if (securityNamespace.error !== undefined) { throw securityNamespace.error; }
    if (securityNamespace.value === undefined) { throw new Error(`securityNamespaceByName(${organization}, 'Git Repositories').value === undefined`); }
    if (securityNamespace.value.namespaceId === undefined) { throw new Error(`securityNamespaceByName(${organization}, 'Git Repositories').value.namespaceId === undefined`); }

    const maxNumerOfTests = 5;

    for (const gitRepository of gitRepositories.value.slice(0, maxNumerOfTests)) {
        const projectId         = gitRepository.project?.id  ; if (projectId         === undefined) { throw new Error("projectId === undefined"        ); }
        const repositoryId      = gitRepository.id           ; if (repositoryId      === undefined) { throw new Error("repositoryId === undefined"     ); }
        const securityNamespaceId = securityNamespace.value.namespaceId;

        {
            const securityToken = AzureDevOpsSecurityTokens.GitRepositories_Project(projectId)

            const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId, token: securityToken });
            if (accessControlLists.error !== undefined) { throw accessControlLists.error; }
            if (accessControlLists.value === undefined) { throw new Error(`accessControlLists(${JSON.stringify({ organization, securityNamespaceId, token: securityToken })}).value === undefined`); }
            if (accessControlLists.value.length === 0 ) { throw new Error(`accessControlLists(${JSON.stringify({ organization, securityNamespaceId, token: securityToken })}).value.length === 0` ); }
        }

        {
            const securityToken = AzureDevOpsSecurityTokens.GitRepositories_Project_Repository(projectId, repositoryId)

            const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId, token: securityToken });
            if (accessControlLists.error !== undefined) { throw accessControlLists.error; }
            if (accessControlLists.value === undefined) { throw new Error(`accessControlLists(${JSON.stringify({ organization, securityNamespaceId, token: securityToken })}).value === undefined`); }
            if (accessControlLists.value.length === 0 ) { throw new Error(`accessControlLists(${JSON.stringify({ organization, securityNamespaceId, token: securityToken })}).value.length === 0` ); }
        }

        {
            if (gitRepository.defaultBranch !== undefined) {
                const securityToken = AzureDevOpsSecurityTokens.GitRepositories_Project_Repository_Branch(projectId, repositoryId, gitRepository.defaultBranch)

                const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId, token: securityToken });
                if (accessControlLists.error !== undefined) { throw accessControlLists.error; }
                if (accessControlLists.value === undefined) { throw new Error(`accessControlLists(${JSON.stringify({ organization, securityNamespaceId, token: securityToken })}).value === undefined`); }
                if (accessControlLists.value.length === 0 ) { throw new Error(`accessControlLists(${JSON.stringify({ organization, securityNamespaceId, token: securityToken })}).value.length === 0` ); }
            }
        }

    }
}, 100000);

const accessControlListsTest = async (azureDevOpsHelper: AzureDevOpsHelper, parameters: {
    organization        : string,
    securityNamespaceId : string,
    token?              : string,
    descriptors?        : Array<string>,
    includeExtendedInfo?: boolean,
    recurse?            : boolean
}): Promise<void> => {

    const accessControlLists = await azureDevOpsHelper.accessControlLists(parameters);
    if (accessControlLists.error !== undefined) { throw accessControlLists.error; }
    if (accessControlLists.value === undefined) { throw new Error(`accessControlLists(${JSON.stringify(parameters)}).value === undefined`); }

    const maxNumerOfTests = 500;

    for (const accessControlList of accessControlLists.value.slice(0, maxNumerOfTests)) {
        parameters.token = accessControlList.token!;
        const accessControlListsItem = await azureDevOpsHelper.accessControlLists(parameters);
        if (accessControlListsItem.error !== undefined) { throw accessControlListsItem.error; }
        if (accessControlListsItem.value === undefined) { throw new Error(`accessControlLists(${JSON.stringify(parameters)}).value === undefined`); }
    }

    for (const accessControlList of accessControlLists.value.slice(0, maxNumerOfTests)) {
        parameters.token = undefined;
        parameters.descriptors = new Array<string>();
        for(const key in  accessControlList.acesDictionary)
        {
            parameters.descriptors.push(key);
        }
        const accessControlListsItem = await azureDevOpsHelper.accessControlLists(parameters);
        if (accessControlListsItem.error !== undefined) { throw accessControlListsItem.error; }
        if (accessControlListsItem.value === undefined) { throw new Error(`accessControlLists(${JSON.stringify(parameters)}).value === undefined`); }
    }
}

test('AzureDevOpsHelper - accessControlLists', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;

    const securityNamespaces = await azureDevOpsHelper.securityNamespaces(organization);
    if (securityNamespaces.error !== undefined) { throw securityNamespaces.error; }
    if (securityNamespaces.value === undefined) { throw new Error(`securityNamespaces(${organization}).value === undefined`); }

    const maxNumerOfTests = 500;

    for (const securityNamespace of securityNamespaces.value.filter(p => p.namespaceId !== undefined).slice(0, maxNumerOfTests)) {
        const securityNamespaceId = securityNamespace.namespaceId!;

        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: undefined, recurse: undefined });
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: undefined, recurse: false     });
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: undefined, recurse: true      });
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: false    , recurse: undefined });
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: false    , recurse: false     });
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: false    , recurse: true      });
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: true     , recurse: undefined });
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: true     , recurse: false     });
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: true     , recurse: true      }); 
    }
}, 100000);

test('AzureDevOpsHelper - workIterations', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;
    const project = config.azureDevOps.projectName;

    const teams = await azureDevOpsHelper.teams(organization);
    if (teams.error !== undefined) { throw teams.error; }
    if (teams.value === undefined) { throw new Error(`teams(${organization}).value === undefined`); }

    const maxNumerOfTests = 10;

    for (const team of teams.value.filter(p => p.id !== undefined).slice(0, maxNumerOfTests)) {
        const teamId = team.id!;

        const workIterations = await azureDevOpsHelper.workIterations(organization, project, teamId);
        if (workIterations.error !== undefined) { throw teams.error; }
        if (workIterations.value === undefined) { throw new Error(`workIterations.value === undefined ${JSON.stringify({organization, project, team})}`); }

        for(const workIteration of workIterations.value.slice(0, maxNumerOfTests)){
            if (workIteration.path === undefined) { throw new Error(`workIteration.path === undefined ${JSON.stringify({ organization, project, team, workIteration })}`); }

            const workIterationResponse = await azureDevOpsHelper.workIteration(organization, project, teamId, workIteration.path);
            if (workIterationResponse.error !== undefined) { throw teams.error; }
            if (workIterationResponse.value === undefined) { throw new Error(`workIterationResponse.value === undefined ${JSON.stringify({ organization, project, team, workIteration })}`); }
        }
    }
}, 100000);

test('AzureDevOpsHelper - workBacklogs', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;
    const project = config.azureDevOps.projectName;

    const teams = await azureDevOpsHelper.teams(organization);
    if (teams.error !== undefined) { throw teams.error; }
    if (teams.value === undefined) { throw new Error(`teams(${organization}).value === undefined`); }

    const maxNumerOfTests = 5;

    for (const team of teams.value.filter(p => p.id !== undefined).slice(0, maxNumerOfTests)) {
        const teamId = team.id!;

        const workBacklogs = await azureDevOpsHelper.workBacklogs(organization, project, teamId);
        if (workBacklogs.error !== undefined) { throw teams.error; }
        if (workBacklogs.value === undefined) { throw new Error(`workBacklogs(${JSON.stringify({ organization, project, teamId })}).value === undefined`); }
    }
}, 100000);

test('AzureDevOpsHelper - workTeamSettings', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;
    const project = config.azureDevOps.projectName;

    const teams = await azureDevOpsHelper.teams(organization);
    if (teams.error !== undefined) { throw teams.error; }
    if (teams.value === undefined) { throw new Error(`teams(${organization}).value === undefined`); }

    const maxNumerOfTests = 5;

    for (const team of teams.value.filter(p => p.id !== undefined).slice(0, maxNumerOfTests)) {
        const teamId = team.id!;

        const workTeamSettings = await azureDevOpsHelper.workTeamSettings(organization, project, teamId);
        if (workTeamSettings.error !== undefined) { throw teams.error; }
        if (workTeamSettings.value === undefined) { throw new Error(`workTeamSettings(${JSON.stringify({ organization, project, teamId })}).value === undefined`); }
    }
}, 100000);

test('AzureDevOpsHelper - classificationNodes', async () => {
    const file = path.join(__dirname, 'out', 'classificationNodes.json');
    await writeFile(file, JSON.stringify({ message: 'test started' }, null, 2));

    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;
    const project      = config.azureDevOps.projectName;

    const parameters = { organization, project, depth: 10000 };
    const classificationNodes = await azureDevOpsHelper.classificationNodes(parameters);
    if (classificationNodes.error !== undefined) { throw classificationNodes.error; }
    if (classificationNodes.value === undefined) { throw new Error(`value === undefined for ${JSON.stringify({ parameters })}`); }

    await writeFile(file, JSON.stringify(classificationNodes.value, null, 2));
}, 100000);