import { AzureDevOpsHelper } from "./AzureDevOpsHelper";
import { GraphMember       } from "azure-devops-node-api/interfaces/GraphInterfaces";

export class GraphMemberWithMembers {
    constructor(
        readonly graphMember: GraphMember, 
        readonly members: Array<GraphMemberWithMembers>
    ) { }

    flatten(): Array<{ container: GraphMember, member: GraphMember }> {
        const map = new Map<string, {  container: GraphMember, member: GraphMember }>();

        for (const member of this.members) {
            map.set(`${this.id(this.graphMember, member.graphMember)}`, { container: this.graphMember, member: member.graphMember });
            const membersResolved = this.getFlat(this.members);
            for (const subitem of membersResolved) {
                map.set(`${this.id(subitem.container, subitem.member)}`, subitem);
            }
        }

        return [...map.values()];
    }

    private id(container: GraphMember, member: GraphMember) { return `${container.descriptor?.toLowerCase()}-${member.descriptor?.toLowerCase()}`; }

    private getFlat(items: Array<GraphMemberWithMembers>): Array<{ container: GraphMember, member: GraphMember }> {
        const map = new Map<string, { container: GraphMember, member: GraphMember }>();

        for (const item of items) {
            for (const member of item.members) {
                map.set(`${this.id(item.graphMember, member.graphMember)}`, { container: item.graphMember, member: member.graphMember });
                const memberOfResolved = this.getFlat(item.members);
                for (const subitem of memberOfResolved) {
                    map.set(`${this.id( subitem.container, subitem.member)}`, subitem);
                }
            }
        }

        return [...map.values()];
    }
}

export class AzureDevOpsMemberResolver {
    async resolveGroupMembers(
        tenantId     : string,
        organization : string,
        principalName: string
    ): Promise<GraphMemberWithMembers> {

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

        const group = await azureDevOpsHelper.groupByPrincipalName(organization, principalName);

        if (group?.descriptor === undefined) {
            throw new Error(JSON.stringify({ organization, principalName, group, message: 'Failed to resolve group.descriptor.' }));
        }

        const graphSubjectContainerFor = await this.resolveGroups(azureDevOpsHelper, organization, group.descriptor, {});

        return graphSubjectContainerFor;
    }

    private async resolveGroups(azureDevOpsHelper: AzureDevOpsHelper, organization: string, subjectDescriptor: string, cache: { [id: string]: GraphMember }): Promise<GraphMemberWithMembers> {
        // cache aside... to reduce resolving the same subjectDescriptor again and again
        // example: user is part of multiple groups
        cache[subjectDescriptor] = cache[subjectDescriptor] ?? await azureDevOpsHelper.graphSubjectLookup(organization, subjectDescriptor);

        const graphMember = cache[subjectDescriptor];

        if (graphMember === undefined) {
            throw new Error(JSON.stringify({ organization, subjectDescriptor, message: 'Failed to resolve graphSubject.' }));
        }

        const graphSubjectContainerFor = new GraphMemberWithMembers(graphMember as GraphMember, new Array<GraphMemberWithMembers>() );

        if (AzureDevOpsHelper.isGraphUser(graphMember)) {
            return graphSubjectContainerFor;
        }

        const graphMembershipLists = await azureDevOpsHelper.graphMembershipsLists([{ organization, subjectDescriptor, direction: 'down' }]);

        const graphMemberships = graphMembershipLists.map(p => p.result).flat();

        for (const graphMembership of graphMemberships) {
            if (graphMembership.memberDescriptor === undefined) {
                throw new Error(JSON.stringify({ organization, subjectDescriptor, graphSubject: graphMember, graphMembership, message: 'Failed to resolve graphMembership.memberDescriptor.' }));
            }

            const member = await this.resolveGroups(azureDevOpsHelper, organization, graphMembership.memberDescriptor, cache);

            graphSubjectContainerFor.members.push(member);
        }

        return graphSubjectContainerFor;
    }
}
