import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";
import { GraphGroup, GraphUser     } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Guid                      } from "../../src/Guid";

test('AzureDevOpsHelper - user-per-project', async () => {

    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;
    const maxNumerOfTests = 1000;

    const file = path.join(__dirname, 'out', `user-per-project-${organization}.md`);
    await writeFile(file, 'test started');

    const users = await azureDevOpsHelper.graphUsersList(organization);
    if (users.error !== undefined) { throw users.error; }
    if (users.value === undefined) { throw new Error("users.value === undefined"); }

    users.value.sort((a: GraphUser, b: GraphUser) => `${a.displayName}`.localeCompare(`${b.displayName}`));

    const groups = await azureDevOpsHelper.graphGroupsList(organization);
    if (groups.error !== undefined) { throw users.error; }
    if (groups.value === undefined) { throw new Error("groups.value === undefined"); }

    const usersGroups = new Array<{ user: GraphUser, groups: Array<GraphGroup> }>
    for (const user of users.value.slice(0, maxNumerOfTests)) {
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
    const containsGroupType = (grps: Array<GraphGroup>, groupType: string): boolean | undefined => {
        for (const grp of grps) {
            const parts = `${grp.principalName}`.split('\\');
            if (parts.length !== 2) { return undefined; }
            if (parts[1].toLowerCase() === groupType.toLowerCase()) {
                return true;
            }
        }
        return false;
    }

    const usersGroupsFlat = usersGroups.map(userGroups => {
        return {
            user: {
                principalName: userGroups.user.principalName,
                displayName: userGroups.user.displayName,
                url: userGroups.user.url
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

    const countsOfUsers = new Array<number>();
    for (const item of distinctProjectsSortedWithorganizationFirst) {
        const count = usersGroupsFlat.filter(p => p.projects.find(p => p.toLowerCase() === item?.toLowerCase()) !== undefined).length;
        countsOfUsers.push(count);
    }

    const lines = new Array<string>();
    lines.push(`|  |${distinctProjectsSortedWithorganizationFirst.map(p => `${p}|`).join('')}`);
    lines.push(`|:-|${distinctProjectsSortedWithorganizationFirst.map(p => ':-: |').join('')}`);
    lines.push(`|  |${countsOfUsers.map(p => `${p}|`).join('')}`);
    for (const userGroupsFlat of usersGroupsFlat) {
        const line = Array<string | undefined>();
        line.push(`[${userGroupsFlat.user.displayName}](${userGroupsFlat.user.url} "${userGroupsFlat.user.principalName}")`);
        for (const project of distinctProjectsSortedWithorganizationFirst) {
            line.push(
                userGroupsFlat.projects.find(p => p === project) === undefined
                    ? undefined
                    : '•'
            );
        }
        lines.push(`|${line.join('|')}|`);
    }

    await writeFile(file, lines.join('\n'));
}, 100000);