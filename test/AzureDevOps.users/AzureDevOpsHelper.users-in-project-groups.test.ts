import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPortalLinks    } from "../../src/AzureDevOpsPortalLinks";
import { GraphGroup, GraphUser     } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Guid                      } from "../../src/Guid";
import { Markdown                  } from "../../src/Converters/Markdown";
import { rm, mkdir, writeFile      } from "fs/promises";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - users-in-project-groups', async () => {

    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const projectName       = config.azureDevOps.projectName;
    const tenantId          = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const maxNumberOfTests  = config.azureDevOps.maxNumberOfTests;

    await mkdir(path.join(__dirname, 'out', organization), { recursive: true });
    const file = path.join(__dirname, 'out', organization, `users-in-project-groups-${organization}-${projectName}.md`);
    await rm(file, {force: true});

    const scopeDescriptor = await azureDevOpsHelper.graphDescriptorForProjectName(organization, projectName);

    const usersPromise = azureDevOpsHelper.graphUsersListForScopeDescriptor (organization, scopeDescriptor                  );
    const groups = await azureDevOpsHelper.graphGroupsListForScopeDescriptor(organization, scopeDescriptor, maxNumberOfTests);

    const membershipsAll = await azureDevOpsHelper.graphMembershipsLists(
        groups
        .filter(group => group.descriptor !== undefined)
        .map(group => { return { organization, subjectDescriptor: group.descriptor!, direction: 'down' } })
    );

    const users = await usersPromise;

    const groupsUsers = new Array<{ group: GraphGroup, user: GraphUser }>

    for (const group of groups) {
        if (group.descriptor === undefined) {
            continue;
        }
        const subjectDescriptor = group.descriptor;
        const memberships = membershipsAll.find(p => p.parameters.subjectDescriptor === subjectDescriptor);
        if (memberships === undefined) {
            throw new Error(JSON.stringify({ error: 'Failed to resolve graphMemberships', organization, projectName, subjectDescriptor }));
        }

        for (const membership of memberships.result) {
            const user = users.find(p => p.descriptor === membership.memberDescriptor);
            if (user !== undefined) {
                if (Guid.isGuid(user.principalName)) {
                    // skip the build in accounts
                    continue;
                }
                groupsUsers.push({group, user});
            }
        }
    }

    groupsUsers.sort(
        (a: { group: GraphGroup, user: GraphUser }, 
         b: { group: GraphGroup, user: GraphUser }
        ) => `${a.group.displayName}-${a.user.displayName}`.toLowerCase().localeCompare(`${b.group.displayName}-${b.user.displayName}`.toLowerCase()));

    const markdown = Markdown.table(
        `${organization} / ${projectName}`,
        ['Group', 'User'], 
        groupsUsers.map(p => [
            Markdown.getLinkWithToolTip(p.group.principalName ?? '', AzureDevOpsPortalLinks.Permissions(organization, projectName, p.group.descriptor), "open permissions"),
            p.user.displayName + '<br/>'+
            Markdown.getLinkWithToolTip(p.user .principalName ?? '', AzureDevOpsPortalLinks.Permissions(organization, projectName, p.user .descriptor), "open permissions")
        ])
    );
 
    await writeFile(file, markdown);

    console.log({ file });
}, 100000);