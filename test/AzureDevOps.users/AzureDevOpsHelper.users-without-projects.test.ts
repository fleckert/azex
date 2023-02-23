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
    const maxNumberOfTests   = config.azureDevOps.maxNumberOfTests;

    const file = path.join(__dirname, 'out', `users-without-projects-${organization}-sequential.md`);

    const users = await azureDevOpsHelper.graphUsersList(organization, maxNumberOfTests);

    users.sort((a: GraphUser, b: GraphUser) => `${a.displayName}`.localeCompare(`${b.displayName}`));

    const usersIsNotInGroups = new Array<GraphUser>();

    const membershipsAll = await azureDevOpsHelper.graphMembershipsLists(
        users
        .filter(user => user.descriptor !== undefined)
        .map(user => { return { organization, subjectDescriptor: user.descriptor!, direction: 'up' } })
    );

    for (const user of users) {
        if (user.descriptor === undefined) {
            continue;
        }
        const subjectDescriptor = user.descriptor;
        const direction = 'up';
        const memberships = membershipsAll.find(p => p.parameters.subjectDescriptor === subjectDescriptor);
        if (memberships === undefined) {
            throw new Error(JSON.stringify({ error: 'Failed to resolve graphMemberships', organization, subjectDescriptor }));
        }

        if (memberships.result.length === 0) {
            usersIsNotInGroups.push(user);
        }
    }

    const markdown = 'Users without group memberships\n\n'+Markdown.tableKeyValue('DisplayName', 'PrincipalName', usersIsNotInGroups.map(p => { return { key: p.displayName, value: p.principalName } }));
    await writeFile(file, markdown);

    console.log({ file });
}, 100000);


test('AzureDevOpsHelper - users-without-projects-batched', async () => {
    const config             = await TestConfigurationProvider.get();
    const organization       = config.azureDevOps.organization;
    const tenantId           = config.azureDevOps.tenantId;
    const azureDevOpsHelper  = await AzureDevOpsHelper.instance(tenantId);
    const maxNumberOfTests   = config.azureDevOps.maxNumberOfTests;

    const file = path.join(__dirname, 'out', `users-without-projects-${organization}-batched.md`);

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
        `Users without group memberships in '${organization}'`,
        ['DisplayName', 'PrincipalName'],
        usersIsNotInGroups.map(p => [p.displayName ?? '', p.principalName ?? ''])
    );
    
    await writeFile(file, markdown);

    console.log({ file });
}, 100000);