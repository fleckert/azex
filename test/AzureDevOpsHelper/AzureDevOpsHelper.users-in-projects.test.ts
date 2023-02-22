import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { GraphGroup, GraphUser     } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Guid                      } from "../../src/Guid";
import { Markdown                  } from "../../src/Converters/Markdown";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsHelper - users-in-projects', async () => {

    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const projectName       = config.azureDevOps.projectName;
    const tenantId          = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const maxNumerOfTests   = 5000;


    const file = path.join(__dirname, 'out', `users-in-projects-${organization}.md`);
    await writeFile(file, 'test started');

    const users = await azureDevOpsHelper.graphUsersList(organization);

    const groups = await azureDevOpsHelper.graphGroupsListForProjectName(organization, projectName, maxNumerOfTests);

    const groupsUsers = new Array<{ group: GraphGroup, user: GraphUser }>

    for (const group of groups) {
        if (group.descriptor === undefined) {
            continue;
        }
        const subjectDescriptor = group.descriptor;
        const direction = 'down';
        const memberships = await azureDevOpsHelper.graphMembershipsList(organization, subjectDescriptor, direction);
        for (const membership of memberships) {
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

    const lineBreak = "<br/>"
    const markdown = Markdown.tableKeyValue('Group', 'User', groupsUsers.map(p => { return { key: p.group.principalName, value: `${p.user.displayName}${lineBreak}${p.user.principalName}` } }));
 
    await writeFile(file, markdown);

    console.log({ file });
}, 100000);