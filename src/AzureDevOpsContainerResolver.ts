import { AzureDevOpsHelper } from "./AzureDevOpsHelper";
import { GraphMember       } from "azure-devops-node-api/interfaces/GraphInterfaces";

export class GraphMemberWithContainers {
    constructor(
        readonly graphMember: GraphMember, 
        readonly containers: Array<GraphMemberWithContainers>
    ) { }

    flatten(): Array<{ member: GraphMember, container: GraphMember }> {
        const map = new Map<string, { member: GraphMember, container: GraphMember }>();

        for (const container of this.containers) {
            map.set(`${this.id(this.graphMember, container.graphMember)}`, { member: this.graphMember, container: container.graphMember });
            const containersResolved = this.getFlat(this.containers);
            for (const subitem of containersResolved) {
                map.set(`${this.id(subitem.container, subitem.member)}`, subitem);
            }
        }

        return [...map.values()];
    }

    private id(member: GraphMember, container: GraphMember) { return `${member.descriptor?.toLowerCase()}-${container.descriptor?.toLowerCase()}`; }

    private getFlat(items: Array<GraphMemberWithContainers>): Array<{  member: GraphMember, container: GraphMember }> {
        const map = new Map<string, { member: GraphMember, container: GraphMember }>();

        for (const item of items) {
            for (const container of item.containers) {
                map.set(`${this.id(item.graphMember, container.graphMember)}`, { member: item.graphMember , container: container.graphMember});
                const containersResolved = this.getFlat(item.containers);
                for (const subitem of containersResolved) {
                    map.set(`${this.id( subitem.member, subitem.container)}`, subitem);
                }
            }
        }

        return [...map.values()];
    }
}

export class AzureDevOpsContainerResolver {
    async resolve(
        tenantId     : string,
        organization : string,
        principalName: string
    ): Promise<GraphMemberWithContainers> {

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

        const graphSubject = await azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization,['User','Group'], principalName);

        if (graphSubject?.descriptor === undefined) {
            throw new Error(JSON.stringify({ organization, principalName, graphSubject, message: 'Failed to resolve graphSubject.descriptor.' }));
        }

        const graphMemberWithContainers = await this.resolveContainers(azureDevOpsHelper, organization, graphSubject.descriptor, {});

        return graphMemberWithContainers;
    }

    private async resolveContainers(azureDevOpsHelper: AzureDevOpsHelper, organization: string, subjectDescriptor: string, cache: { [id: string]: GraphMember }): Promise<GraphMemberWithContainers> {
        // cache aside... to reduce resolving the same subjectDescriptor again and again
        // example: user is part of multiple groups
        cache[subjectDescriptor] = cache[subjectDescriptor] ?? await azureDevOpsHelper.graphSubjectLookup(organization, subjectDescriptor);

        const graphSubject = cache[subjectDescriptor];

        if (graphSubject === undefined) {
            throw new Error(JSON.stringify({ organization, subjectDescriptor, message: 'Failed to resolve graphSubject.' }));
        }

        const graphSubjectContainerFor = new GraphMemberWithContainers(graphSubject as GraphMember, new Array<GraphMemberWithContainers>() );

        const graphMembershipLists = await azureDevOpsHelper.graphMembershipsLists([{ organization, subjectDescriptor, direction: 'up' }]);

        const graphMemberships = graphMembershipLists.map(p => p.result).flat();

        for (const graphMembership of graphMemberships) {
            if (graphMembership.containerDescriptor === undefined) {
                throw new Error(JSON.stringify({ organization, subjectDescriptor, graphSubject, graphMembership, message: 'Failed to resolve graphMembership.memberDescriptor.' }));
            }

            const container = await this.resolveContainers(azureDevOpsHelper, organization, graphMembership.containerDescriptor, cache);

            graphSubjectContainerFor.containers.push(container);
        }

        return graphSubjectContainerFor;
    }
}
