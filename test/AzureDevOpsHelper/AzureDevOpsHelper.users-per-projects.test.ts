import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsWrapper        } from "../../src/AzureDevOpsWrapper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";
import { GraphGroup, GraphUser     } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Guid                      } from "../../src/Guid";

test('AzureDevOpsHelper - user-per-project', async () => {

    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const baseUrl = config.azureDevOps.baseUrl;
    const tenantId    = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const azureDevOpsWrapper = await AzureDevOpsWrapper.instance(baseUrl, tenantId);

    const maxNumerOfTests = 50;

    const file = path.join(__dirname, 'out', `users-per-projects-${organization}.md`);
    await writeFile(file, 'test started');

    const projectsList = await azureDevOpsWrapper.projects();

    const users = await azureDevOpsHelper.graphUsersList(organization);

    users.sort((a: GraphUser, b: GraphUser) => `${a.displayName}`.localeCompare(`${b.displayName}`));

    const groups = await azureDevOpsHelper.graphGroupsList(organization);

    const usersGroups = new Array<{ user: GraphUser, groups: Array<GraphGroup> }>
    for (const user of users.slice(0, maxNumerOfTests)) {
        if (Guid.isGuid(user.principalName)) {
            // skip the build in accounts
            continue;
        }
        if (user.descriptor === undefined) {
            continue;
        }
        const subjectDescriptor = user.descriptor;;
        const direction = 'up';
        const memberships = await azureDevOpsHelper.graphMembershipsList(organization, subjectDescriptor, direction);

        const userGroups = { user, groups: new Array<GraphGroup>() };
        for (const membership of memberships) {
            const group = groups.find(p => p.descriptor === membership.containerDescriptor);
            if (group !== undefined) {
                userGroups.groups.push(group);
            }
        }
        usersGroups.push(userGroups);
    }

    usersGroups.sort((a: { user: GraphUser }, b: { user: GraphUser }) => `${a.user.displayName?.toLowerCase()}`.localeCompare(`${b.user.displayName?.toLowerCase()}`));
    const getProjectNameFromGroup = (grp: GraphGroup): string => { return `${grp.principalName}`.split('\\')[0]?.replaceAll('[', '').replaceAll(']', '') }

    const distinctProjects = new Set<string>();
    for (const userGroupsFlat of usersGroups) {
        for (const project of userGroupsFlat.groups.map(getProjectNameFromGroup)) {
            distinctProjects.add(project);
        }
    }
    const distinctProjectsSorted = [...distinctProjects];
    distinctProjectsSorted.sort();
    const organizationFromProjects    = distinctProjectsSorted.find  (p => p.toLowerCase() === config.azureDevOps.organization.toLowerCase());
    const projectsWithoutOrganization = distinctProjectsSorted.filter(p => p.toLowerCase() !== config.azureDevOps.organization.toLowerCase());
    const distinctProjectsSortedWithorganizationFirst = [organizationFromProjects ?? organization, ...projectsWithoutOrganization];

    const countsOfUsers = new Array<number>();
    for (const item of distinctProjectsSortedWithorganizationFirst) {
        let count  = 0;
        for(const userGroups of usersGroups){
            if(userGroups.groups.find(p => p.principalName?.toLowerCase().startsWith(`[${item?.toLowerCase()}]`)) !== undefined){
                count++;
            }
        }
        countsOfUsers.push(count);
    }

    const lineBreak = "&#013;"
    const lines = new Array<string>();
    lines.push(`|  |${distinctProjectsSortedWithorganizationFirst.map(p => `${p}|`).join('')}`);
    lines.push(`|:-|${distinctProjectsSortedWithorganizationFirst.map(p => ':-: |').join('')}`);
    lines.push(`|  |${countsOfUsers                              .map(p => `${p}|`).join('')}`);
    for (const userGroups of usersGroups) {
        const line = Array<string | undefined>();
        line.push(`[${userGroups.user.displayName}](${userGroups.user.url} "${userGroups.user.principalName}")`);
        for (const project of distinctProjectsSortedWithorganizationFirst) {
            if (userGroups.groups.find(p => p.principalName?.toLowerCase().startsWith(`[${project.toLowerCase()}]`)) === undefined) {
                line.push(undefined);
            }
            else {
                const projectItem = projectsList.find(p => p.name?.toLowerCase() === project?.toLowerCase());

                const groupsInProject = userGroups.groups.filter(p => p.principalName?.toLowerCase().startsWith(`[${project?.toLowerCase()}]`)).map(p => p.principalName?.split('\\')[1]);
                groupsInProject.sort();
                const link = project?.toLowerCase() === organization.toLowerCase()
                           ? baseUrl
                           : projectItem?._links?.web?.href?.replaceAll(' ', '%20');

                line.push(`[•](${link ?? ''} "${groupsInProject.map(p => `${p?.trim()}`).join(lineBreak)}")`);
            }
        }
        lines.push(`|${line.join('|')}|`);
    }

    await writeFile(file, lines.join('\n'));

    console.log({ file });
}, 100000);