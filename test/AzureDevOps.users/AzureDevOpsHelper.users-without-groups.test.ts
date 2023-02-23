import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPortalLinks    } from "../../src/AzureDevOpsPortalLinks";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { rm, writeFile             } from "fs/promises";
import { GraphUser                 } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Markdown                  } from "../../src/Converters/Markdown";

test('AzureDevOpsHelper - users-without-groups', async () => {
    const config             = await TestConfigurationProvider.get();
    const organization       = config.azureDevOps.organization;
    const tenantId           = config.azureDevOps.tenantId;
    const azureDevOpsHelper  = await AzureDevOpsHelper.instance(tenantId);
    const maxNumberOfTests   = config.azureDevOps.maxNumberOfTests;

    const file = path.join(__dirname, 'out', `users-without-groups-${organization}.md`);
    await rm(file, {force: true});

    const users = await azureDevOpsHelper.graphUsersList(organization, maxNumberOfTests);

    users.sort((a: GraphUser, b: GraphUser) => `${a.displayName}`.localeCompare(`${b.displayName}`));

    const usersIsNotInGroups = new Array<GraphUser>();

    const subjectDescriptors = users.filter(p => p.descriptor !== undefined).map(p => p.descriptor!);
    const direction = 'up';
    const graphMembershipsLists = await azureDevOpsHelper.graphMembershipsLists(subjectDescriptors.map(subjectDescriptor => { return { organization, subjectDescriptor, direction } }));

    for (const user of users) {
        if (user.descriptor === undefined) {
            continue;
        }

        const graphMembershipsList = graphMembershipsLists.find(p => p.parameters.subjectDescriptor === user.descriptor);
        if (graphMembershipsList === undefined) {
            usersIsNotInGroups.push(user);
        }
        else if (graphMembershipsList.result.length === 0) {
            usersIsNotInGroups.push(user);
        }
    }

    const markdown = Markdown.table(
        `${organization} - Users without group memberships`,
        ['DisplayName', 'PrincipalName'],
        usersIsNotInGroups.map(p => [
            p.displayName ?? '', 
            `[${p.principalName}](${AzureDevOpsPortalLinks.Permissions(organization, undefined, p.descriptor)} "open permissions")`
        ])
    );
    
    await writeFile(file, markdown);

    console.log({ file });
}, 100000);