import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPortalLinks    } from "../../src/AzureDevOpsPortalLinks";
import { GraphGroup, GraphUser     } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Guid                      } from "../../src/Guid";
import { Markdown                  } from "../../src/Converters/Markdown";
import { writeFile                 } from "fs/promises";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper                } from "../_TestHelper/TestHelper";

test('AzureDevOpsHelper - users-in-collection-groups', async () => {

    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenant            = config.azureDevOps.tenant;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);
    const maxNumberOfTests  = config.azureDevOps.maxNumberOfTests;

    const file = await TestHelper.prepareFile([__dirname, 'out', organization, `${organization}-users-in-collection-groups.md`]);

    const usersPromise = azureDevOpsHelper.graphUsersList(organization);

    const groups = await azureDevOpsHelper.graphGroupsList(organization, maxNumberOfTests);

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
            throw new Error(JSON.stringify({ error: 'Failed to resolve graphMemberships', organization, subjectDescriptor }));
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
        ) => `${a.group.principalName}-${a.user.displayName}`.toLowerCase().localeCompare(`${b.group.principalName}-${b.user.displayName}`.toLowerCase()));

    const markdown = Markdown.table(
        organization,
        ['Group', 'User'],
        groupsUsers.map(p => [
            Markdown.getLinkWithToolTip(p.group.principalName ?? '', AzureDevOpsPortalLinks.Permissions(organization, undefined, p.group.descriptor), "open permissions"),
            p.user.displayName + '<br/>' +
            Markdown.getLinkWithToolTip(p.user.principalName ?? '' , AzureDevOpsPortalLinks.Permissions(organization, undefined, p.user.descriptor ), "open permissions")
        ])
    );
 
    await writeFile(file, markdown);

    console.log({ file });
}, 100000);