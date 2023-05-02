import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPortalLinks    } from "../../src/AzureDevOpsPortalLinks";
import { GraphUser                 } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Helper                    } from "../../src/Helper";
import { Markdown                  } from "../../src/Converters/Markdown";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper                } from "../_TestHelper/TestHelper";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsHelper.user-group-check.accenture.test.ts', async () => {
    const data : Array<Array<string>>= [
        //['principalName-group', '@company.com'],
    ];

    for (const datum of data) {
        await runTest(datum[0], datum[1])
    }
}, 100000);

const runTest = async (groupName: string, userFilter: string) => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;

    if (groupName === undefined) { return; }

    const file = await TestHelper.prepareFile([__dirname, 'out', organization, `${organization}-users-missing-in-group-${groupName}.md`]);

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    const usersPromise = azureDevOpsHelper.graphUsersList(organization, maxNumberOfTests);

    const group = await azureDevOpsHelper.groupByPrincipalName(organization, groupName);

    if (group?.descriptor === undefined) { throw new Error(); }

    const graphMembershipsResults = await azureDevOpsHelper.graphMembershipsLists([{ organization, subjectDescriptor: group.descriptor, direction: 'down' }])

    const existingMemberDescriptors = [...new Set(graphMembershipsResults.map(p => p.result).flat().map(p => p.memberDescriptor).filter(p => p !== undefined).map(p => p!))];
    
    const users = await usersPromise;
    const existingUserDescriptors = users
                                    .filter(p => userFilter === undefined || `${p.principalName}`.indexOf(userFilter) > 0)
                                    .map(p => p.descriptor)
                                    .filter(p => p !== undefined)
                                    .map(p => p!);

    const { itemsInAandNotInB: userDescriptorsWithoutGroupAssignment } = Helper.getMissingElements(existingUserDescriptors, existingMemberDescriptors, (a, b) => a.toLowerCase() === b.toLowerCase());

    const usersWithoutGroupAssignment = new Array<GraphUser>();

    for (const descriptor of userDescriptorsWithoutGroupAssignment) {
        const user = users.find(p => p.descriptor !== undefined && p.descriptor.toLowerCase() === descriptor.toLowerCase());

        if (user === undefined) { throw new Error(); }

        usersWithoutGroupAssignment.push(user);
    }

    usersWithoutGroupAssignment.sort((a, b) => `${a.displayName}`.toLowerCase().localeCompare(`${b.displayName}`.toLowerCase()));

    const markdown = Markdown.table(
        `${organization} - users with '${userFilter}' missing in '${group.principalName}'`,
        [ 'displayName' ],
        usersWithoutGroupAssignment.map(p => [
            Markdown.getLinkWithToolTip(`${p.displayName}`, AzureDevOpsPortalLinks.Permissions(organization,undefined, p.descriptor!), `open permissions for ${p.principalName}`)
        ])
    );

    await writeFile(file, markdown);

    console.log({ file });
}
