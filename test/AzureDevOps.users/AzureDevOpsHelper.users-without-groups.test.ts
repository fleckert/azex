import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPortalLinks    } from "../../src/AzureDevOpsPortalLinks";
import { GraphUser                 } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Markdown                  } from "../../src/Converters/Markdown";
import { rm, mkdir, writeFile      } from "fs/promises";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - users-without-groups', async () => {
    const config             = await TestConfigurationProvider.get();
    const organization       = config.azureDevOps.organization;
    const tenant             = config.azureDevOps.tenant;
    const azureDevOpsHelper  = await AzureDevOpsHelper.instance(tenant);
    const maxNumberOfTests   = config.azureDevOps.maxNumberOfTests;

    await mkdir(path.join(__dirname, 'out', organization), { recursive: true });
    const file = path.join(__dirname, 'out', organization, `users-without-groups-${organization}.md`);
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
            Markdown.getLinkWithToolTip(p.displayName   ?? '', p.url ?? ''                                                              , "open details"    ),
            Markdown.getLinkWithToolTip(p.principalName ?? '', AzureDevOpsPortalLinks.Permissions(organization, undefined, p.descriptor), "open permissions")
        ])
    );
    
    await writeFile(file, markdown);

    console.log({ file });
}, 100000);