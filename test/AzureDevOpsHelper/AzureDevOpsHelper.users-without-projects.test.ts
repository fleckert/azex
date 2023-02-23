import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";
import { GraphUser                 } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Markdown                  } from "../../src/Converters/Markdown";

test('AzureDevOpsHelper - users-without-projects-sequential', async () => {
    const config             = await TestConfigurationProvider.get();
    const organization       = config.azureDevOps.organization;
    const tenantId           = config.azureDevOps.tenantId;
    const azureDevOpsHelper  = await AzureDevOpsHelper.instance(tenantId);
    const maxNumberOfTests   = 50000 ?? config.azureDevOps.maxNumberOfTests;

    const file = path.join(__dirname, 'out', `users-without-projects-${organization}-sequential.md`);

    const users = await azureDevOpsHelper.graphUsersList(organization, maxNumberOfTests);

    users.sort((a: GraphUser, b: GraphUser) => `${a.displayName}`.localeCompare(`${b.displayName}`));

    const usersIsInGroups = new Array<GraphUser>();

    for (const user of users) {
        if (user.descriptor === undefined) {
            continue;
        }
        const subjectDescriptor = user.descriptor;
        const direction = 'up';
        const memberships = await azureDevOpsHelper.graphMembershipsList(organization, subjectDescriptor, direction);
        if (memberships.length === 0) {
            usersIsInGroups.push(user);
        }
    }

    const markdown = 'Users without group memberships\n\n'+Markdown.tableKeyValue('DisplayName', 'PrincipalName', usersIsInGroups.map(p => { return { key: p.displayName, value: p.principalName } }));
    await writeFile(file, markdown);

    console.log({ file });
}, 100000);


test('AzureDevOpsHelper - users-without-projects-parallel', async () => {
    const config             = await TestConfigurationProvider.get();
    const organization       = config.azureDevOps.organization;
    const tenantId           = config.azureDevOps.tenantId;
    const azureDevOpsHelper  = await AzureDevOpsHelper.instance(tenantId);
    const maxNumberOfTests   = 50000 ?? config.azureDevOps.maxNumberOfTests;

    const file = path.join(__dirname, 'out', `users-without-projects-${organization}-parallel.md`);

    const users = await azureDevOpsHelper.graphUsersList(organization, maxNumberOfTests);

    users.sort((a: GraphUser, b: GraphUser) => `${a.displayName}`.localeCompare(`${b.displayName}`));

    const usersIsInGroups = new Array<GraphUser>();

    const subjectDescriptors = users.filter(p => p.descriptor !== undefined).map(p => p.descriptor!);
    const direction = 'up';
    const graphMembershipsLists = await azureDevOpsHelper.graphMembershipsLists(organization, subjectDescriptors, direction);

    for (const user of users) {
        if (user.descriptor === undefined) {
            continue;
        }

        const graphMembershipsList = graphMembershipsLists.find(p => p.subjectDescriptor === user.descriptor);
        if (graphMembershipsList === undefined) {
            usersIsInGroups.push(user);
        }
        else if (graphMembershipsList.graphMemberShips.length === 0) {
            usersIsInGroups.push(user);
        }
    }

    const markdown = 'Users without group memberships\n\n'+Markdown.tableKeyValue('DisplayName', 'PrincipalName', usersIsInGroups.map(p => { return { key: p.displayName, value: p.principalName } }));
    await writeFile(file, markdown);

    console.log({ file });
}, 100000);