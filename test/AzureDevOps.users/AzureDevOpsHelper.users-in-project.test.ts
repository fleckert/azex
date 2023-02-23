import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { GraphGroup, GraphUser     } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Guid                      } from "../../src/Guid";
import { Markdown                  } from "../../src/Converters/Markdown";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsHelper - users-in-project', async () => {

    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const projectName       = config.azureDevOps.projectName;
    const tenantId          = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const maxNumberOfTests  = config.azureDevOps.maxNumberOfTests;

    const file = path.join(__dirname, 'out', `users-in-project-${organization}-${projectName}.md`);
    await writeFile(file, 'test started');

    const users = await azureDevOpsHelper.graphUsersList(organization);

    const groups = await azureDevOpsHelper.graphGroupsListForProjectName(organization, projectName, maxNumberOfTests);

    const membershipsAll = await azureDevOpsHelper.graphMembershipsLists(
        groups
        .filter(group => group.descriptor !== undefined)
        .map(group => { return { organization, subjectDescriptor: group.descriptor!, direction: 'down' } })
    );

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

    const lineBreak = "<br/>"
    const markdown = Markdown.table(
        `Users in '${organization}' / '${projectName}'`,
        ['Group', 'User'], 
        groupsUsers.map(p => [`${p.group.displayName}`, `${p.user.displayName}${lineBreak}${p.user.principalName}`])
    );
 
    await writeFile(file, markdown);

    console.log({ file });
}, 100000);