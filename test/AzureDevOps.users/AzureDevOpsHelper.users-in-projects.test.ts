import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPortalLinks    } from "../../src/AzureDevOpsPortalLinks";
import { AzureDevOpsWrapper        } from "../../src/AzureDevOpsWrapper";
import { GraphGroup, GraphUser     } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Guid                      } from "../../src/Guid";
import { Markdown                  } from "../../src/Converters/Markdown";
import { rm, writeFile             } from "fs/promises";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - users-in-projects', async () => {

    const config             = await TestConfigurationProvider.get();
    const organization       = config.azureDevOps.organization;
    const baseUrl            = config.azureDevOps.baseUrl;
    const tenantId           = config.azureDevOps.tenantId;
    const azureDevOpsHelper  = await AzureDevOpsHelper.instance(tenantId);
    const maxNumberOfTests   = config.azureDevOps.maxNumberOfTests;

    const file = path.join(__dirname, 'out', `users-in-projects-${organization}.md`);
    await rm(file, {force: true});

    const groupsPromise = azureDevOpsHelper.graphGroupsList(organization);

    const users = await azureDevOpsHelper.graphUsersList(organization, maxNumberOfTests);

    users.sort((a: GraphUser, b: GraphUser) => `${a.displayName}`.localeCompare(`${b.displayName}`));

    const membershipsAll = await azureDevOpsHelper.graphMembershipsLists(
        users
        .filter(user => user.descriptor !== undefined)
        .map(user => { return { organization, subjectDescriptor: user.descriptor!, direction: 'up' } })
    );

    const groups = await groupsPromise;

    const usersGroups = new Array<{ user: GraphUser, groups: Array<GraphGroup> }>
    for (const user of users) {
        if (Guid.isGuid(user.principalName)) {
            // skip the build in accounts
            continue;
        }
        if (user.descriptor === undefined) {
            continue;
        }
        const subjectDescriptor = user.descriptor;

        const memberships = membershipsAll.find(p => p.parameters.subjectDescriptor === subjectDescriptor);
        if (memberships === undefined) {
            throw new Error(JSON.stringify({ error: 'Failed to resolve graphMemberships', organization, subjectDescriptor }));
        }

        const userGroups = { user, groups: new Array<GraphGroup>() };
        for (const membership of memberships.result) {
            const group = groups.find(p => p.descriptor === membership.containerDescriptor);
            if (group !== undefined) {
                userGroups.groups.push(group);
            }
        }
        usersGroups.push(userGroups);
    }

    // usersGroups.sort((a: { user: GraphUser }, b: { user: GraphUser }) => `${a.user.displayName?.toLowerCase()}`.localeCompare(`${b.user.displayName?.toLowerCase()}`));
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
    lines.push(`# ${organization}`);
    lines.push(``);
    lines.push(`|  |${distinctProjectsSortedWithorganizationFirst.map(p => `${p}|`).join('')}`);
    lines.push(`|:-|${distinctProjectsSortedWithorganizationFirst.map(p => ':-: |').join('')}`);
    lines.push(`|  |${countsOfUsers                              .map(p => `${p}|`).join('')}`);
    for (const userGroups of usersGroups) {
        const line = Array<string | undefined>();
        const linkUserPermissions = AzureDevOpsPortalLinks.Permissions(organization, undefined, userGroups.user.descriptor);
        line.push(`${userGroups.user.displayName}<br/>${Markdown.getLinkWithToolTip(userGroups.user.principalName ?? '', linkUserPermissions, "open permissions")}`);
        for (const project of distinctProjectsSortedWithorganizationFirst) {
            if (userGroups.groups.find(p => p.principalName?.toLowerCase().startsWith(`[${project.toLowerCase()}]`)) === undefined) {
                line.push(undefined);
            }
            else {
                 const groupsInProject = userGroups.groups.filter(p => p.principalName?.toLowerCase().startsWith(`[${project?.toLowerCase()}]`)).map(p => p.principalName?.split('\\')[1]);
                groupsInProject.sort();
                const linkUserInProjectPermissions = project?.toLowerCase() === organization.toLowerCase()
                                                   ? AzureDevOpsPortalLinks.Permissions(organization, undefined, userGroups.user.descriptor)
                                                   : AzureDevOpsPortalLinks.Permissions(organization, project  , userGroups.user.descriptor);
                const tooltip = groupsInProject.map(p => `${p?.trim()}`).join(lineBreak);
                const markdown = Markdown.getLinkWithToolTip('•', linkUserInProjectPermissions, tooltip);
                line.push(markdown);
            }
        }
        lines.push(`|${line.join('|')}|`);
    }

    await writeFile(file, lines.join('\n'));

    console.log({ file });
}, 100000);