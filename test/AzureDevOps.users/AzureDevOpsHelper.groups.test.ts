import { AzureDevOpsHelper                  } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsMembershipsResolver     } from "../../src/AzureDevOpsMembershipsResolver";
import { AzureDevOpsPortalLinks             } from "../../src/AzureDevOpsPortalLinks";
import { GraphGroup, GraphMember, GraphUser } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Guid                               } from "../../src/Guid";
import { Helper                             } from "../../src/Helper";
import { Markdown                           } from "../../src/Converters/Markdown";
import { TestConfigurationProvider          } from "../_Configuration/TestConfiguration";
import { TestHelper                         } from "../_TestHelper/TestHelper";
import { writeFile                          } from "fs/promises";

test('AzureDevOpsHelper - groups', async () => {

    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;
    const batchSize        = 5;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    const parameters = [
        // 'Project Collection Administrators',
        'Project Administrators',
        // 'Contributors',
    ].map(groupName => { return { azureDevOpsHelper, organization, groupName, maxNumberOfTests } });

    await Helper.batchCalls(parameters, p => testGroup       (p.azureDevOpsHelper, p.organization, p.groupName, p.maxNumberOfTests), batchSize);
    await Helper.batchCalls(parameters, p => testGroupMembers(p.azureDevOpsHelper, p.organization, p.groupName, p.maxNumberOfTests), batchSize);
}, 100000);


const testGroup = async (azureDevOpsHelper:AzureDevOpsHelper,organization:string, groupName: string,maxNumberOfTests:number)=>{
    const file = await TestHelper.prepareFile([__dirname, 'out', organization, `${organization}-${groupName}.md`]);

    const groups = await azureDevOpsHelper.graphGroupsList(organization, maxNumberOfTests);
    const groupsFiltered = groups.filter(group => group.descriptor !== undefined).filter(p => `${p.principalName}`.toLowerCase().indexOf(groupName.toLowerCase()) >= 0);

    const membershipsAll = await azureDevOpsHelper.graphMembershipsLists(
        groupsFiltered.map(group => { return { organization, subjectDescriptor: group.descriptor!, direction: 'down' } })
    );

    const userDescriptors = [...new Set(membershipsAll.map(p => p.result).flat().map(p => p.memberDescriptor).filter(p => p !== undefined).map(p => p!))];

    const graphSubjects = await azureDevOpsHelper.graphSubjectsLookup(organization, userDescriptors);

    const groupsUsers = new Array<{ group: GraphGroup, user: GraphUser }>

    for (const group of groupsFiltered) {
        if (group.descriptor === undefined) {
            continue;
        }
        const subjectDescriptor = group.descriptor;
        const memberships = membershipsAll.find(p => p.parameters.subjectDescriptor === subjectDescriptor);
        if (memberships === undefined) {
            throw new Error(JSON.stringify({ error: 'Failed to resolve graphMemberships', organization, subjectDescriptor }));
        }

        for (const membership of memberships.result) {
            if (membership.memberDescriptor === undefined) {
                continue;
            }

            const graphSubject = graphSubjects[membership.memberDescriptor];
            if (graphSubject !== undefined && AzureDevOpsHelper.isGraphUser(graphSubject)) {
                const user = graphSubject as GraphUser;
                
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
        `${organization} / ${groupName} - users (no groups)`,
        ['Group', 'User', ''],
        groupsUsers.map(p => [
            Markdown.getLinkWithToolTip(p.group.principalName ?? '', AzureDevOpsPortalLinks.Permissions(organization, undefined, p.group.descriptor), "open permissions"),
            p.user.displayName ?? '',
            Markdown.getLinkWithToolTip(p.user.principalName ?? '' , AzureDevOpsPortalLinks.Permissions(organization, undefined, p.user.descriptor ), "open permissions")
        ])
    );
 
    await writeFile(file, markdown);

    console.log({ file });
}

const testGroupMembers = async (azureDevOpsHelper: AzureDevOpsHelper, organization: string, groupName: string, maxNumberOfTests: number) => {
    const file = await TestHelper.prepareFile([__dirname, 'out', organization, `${organization}-${groupName}-all.md`]);

    const groups = await azureDevOpsHelper.graphGroupsList(organization, maxNumberOfTests);
    const groupsFiltered = groups.filter(group => group.descriptor !== undefined).filter(p => `${p.principalName}`.toLowerCase().indexOf(groupName.toLowerCase()) >= 0);

    const azureDevOpsMembershipsResolver = new AzureDevOpsMembershipsResolver();

    const parameters = groupsFiltered.map(group => { return { azureDevOpsHelper, organization, subjectDescriptor: group.descriptor! } })
    const batchSize = 5;
    const memberships = await Helper.batchCalls(parameters, p => azureDevOpsMembershipsResolver.resolve(p.azureDevOpsHelper, p.organization, p.subjectDescriptor, 'down'), batchSize);

    const markdowns = [];

    for (const membership of memberships) {

        const containerMembers = membership.result.flatten('down').filter(p => AzureDevOpsHelper.isGraphUser(p.member));
        containerMembers.sort((a, b) => {
            const mapGraphMember = (value: GraphMember) => { return `${AzureDevOpsHelper.isGraphGroup(value) ? `a_${value.principalName}` : value.displayName}`.toLowerCase(); }
            const mapContainerMember = (value: { container: GraphMember; member: GraphMember; }) => {
                return `${mapGraphMember(value.container)}=${mapGraphMember(value.member)}`;
            };
            return mapContainerMember(a).localeCompare(mapContainerMember(b));
        });

        const markdown = Markdown.table(
            `${organization} - ${groupsFiltered.find(p => p.descriptor === membership.parameters.subjectDescriptor)?.principalName}`,
            ['Container', 'Member', ''],
            containerMembers.map(p => [
                Markdown.getLinkWithToolTip(p.container.principalName ?? '', AzureDevOpsPortalLinks.Permissions(organization, undefined, p.container.descriptor), "open permissions"),
                AzureDevOpsHelper.isGraphUser(p.member)
                    ? `${p.member.displayName}`
                    : Markdown.getLinkWithToolTip(p.member.principalName ?? '', AzureDevOpsPortalLinks.Permissions(organization, undefined, p.member.descriptor), "open permissions"),
                AzureDevOpsHelper.isGraphUser(p.member)
                    ? Markdown.getLinkWithToolTip(p.member.principalName ?? '', AzureDevOpsPortalLinks.Permissions(organization, undefined, p.member.descriptor), "open permissions")
                    : ''
            ])
        );

        markdowns.push(markdown);
    }

    await writeFile(file, markdowns.join('\n\n'));

    console.log({ file });
}