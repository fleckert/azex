import { GraphGroup, GraphMember, GraphMembership, GraphSubject } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { AzureDevOpsHelper                                      } from "./AzureDevOpsHelper";

export type GraphSubjectMemberOf = { graphSubject: GraphSubject, memberOf: Array<GraphSubjectMemberOf> };

export class AzureDevOpsPermissionsResolver {
    async resolveGroupMembers(
        tenantId    : string,
        organization: string,
        projectName : string
    ): Promise<Array<{ group: GraphGroup, members: GraphSubject[] }>> {

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

        const groups = await azureDevOpsHelper.graphGroupsListForProjectName(organization, projectName);

        const groupsWithGraphMemberShips = await this.getGroupsWithMemberships(azureDevOpsHelper, organization, groups);

        const subjectDescriptors = this.getSubjectDescriptors(groupsWithGraphMemberShips);

        const graphSubjects = await azureDevOpsHelper.graphSubjectsLookup(organization, subjectDescriptors);

        const groupsWithMembers = this.getGroupsWithMembers(groupsWithGraphMemberShips, graphSubjects);

        return groupsWithMembers;
    }


    async resolveGraphSubjectMemberOf(
        tenantId    : string,
        organization: string,
        projectName : string | undefined,
        graphSubject: GraphSubject
    ): Promise<GraphSubjectMemberOf> {

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

        const groups = projectName !== undefined
                     ? await azureDevOpsHelper.graphGroupsListForProjectName(organization, projectName)
                     : await azureDevOpsHelper.graphGroupsList              (organization             );

        const groupsWithMemberships = await this.getGroupsWithMemberships(azureDevOpsHelper, organization, groups);

        const graphSubjectMemberOf = this.getGraphSubjectMemberOf(graphSubject, groupsWithMemberships);

        return graphSubjectMemberOf;
    }

    toGraphSubjectMemberOf(items: Array<{ group: GraphGroup, members: Array<GraphSubject> }>): Array<GraphSubjectMemberOf> {
        return this.getGraphSubjects(items).map(p => this.getHierarchy(p, items));
    }

    flattenGraphMembers(items: Array<{ container: GraphMember, members: GraphMember[] }>): Array<{ member: GraphMember, container: GraphMember }> {
        const id = (a: GraphMember, b: GraphMember) => `${a.descriptor?.toLowerCase()}-${b.descriptor?.toLowerCase()}`;

        const map = new Map<string, { member: GraphMember, container: GraphMember }>();

        for (const item of items) {
            for (const member of item.members) {
                map.set(id(item.container, member), {
                    container: item.container,
                    member: member,
                });
            }
        }

        return [...map.values()];
    }

    flattenGraphSubjectMemberOf(item: GraphSubjectMemberOf): Array<{ member: GraphMember, container: GraphMember }> {
        const id = (a: GraphMember, b: GraphMember) => `${a.descriptor?.toLowerCase()}-${b.descriptor?.toLowerCase()}`;

        const map = new Map<string, { member: GraphMember, container: GraphMember }>();

        for (const memberOf of item.memberOf) {
            map.set(`${id(item.graphSubject, memberOf.graphSubject)}`, { member: item.graphSubject, container: memberOf.graphSubject });
            const memberOfResolved = this.getGraphSubjectMemberOfFlat(item.memberOf);
            for (const subitem of memberOfResolved) {
                map.set(`${id(subitem.member, subitem.container)}`, subitem);
            }
        }

        return [...map.values()];
    }

    private getGraphSubjectMemberOf(graphSubject: GraphSubject, groupsWithMemberships: Array<{ group: GraphGroup, graphMemberships: Array<GraphMembership> }>)
        : GraphSubjectMemberOf {
        const collection = new Array<GraphGroup>();

        for (const groupWithMemberships of groupsWithMemberships) {
            for (const graphMembership of groupWithMemberships.graphMemberships) {
                if (graphMembership.memberDescriptor?.toLowerCase() === graphSubject.descriptor?.toLowerCase()) {
                    collection.push(groupWithMemberships.group)
                }
            }
        }

        return { graphSubject, memberOf: collection.map(p => this.getGraphSubjectMemberOf(p, groupsWithMemberships)) };
    }

    private async getGroupsWithMemberships(azureDevOpsHelper: AzureDevOpsHelper, organization: string, groups: Array<GraphGroup>): Promise<Array<{ group: GraphGroup, graphMemberships: Array<GraphMembership> }>> {
        const groupsWithGraphMemberShips = new Array<{ group: GraphGroup, graphMemberships: Array<GraphMembership> }>();

        const membershipsAll = await azureDevOpsHelper.graphMembershipsLists(
            groups
            .filter(group => group.descriptor !== undefined)
            .map(group => { return { organization, subjectDescriptor: group.descriptor!, direction: 'down' } })
        );

        for (const group of groups) {
            if (group.descriptor === undefined) {
                throw new Error('group.descriptor === undefined');
            }

            const memberships = membershipsAll.find(p=>p.parameters.subjectDescriptor === group.descriptor) ;

            groupsWithGraphMemberShips.push({
                group,
                graphMemberships: memberships?.result ?? new Array<GraphMembership>()
            });
        }

        return groupsWithGraphMemberShips;
    }

    private getGraphSubjectMemberOfFlat(items: Array<GraphSubjectMemberOf>): Array<{ member: GraphMember, container: GraphMember }> {
        const id = (member: GraphMember, container: GraphMember) => `${member.descriptor?.toLowerCase()}-${container.descriptor?.toLowerCase()}`;

        const map = new Map<string, { member: GraphMember, container: GraphMember }>();

        for (const item of items) {
            for (const memberOf of item.memberOf) {
                map.set(`${id(item.graphSubject, memberOf.graphSubject)}`, { member: item.graphSubject, container: memberOf.graphSubject });
                const memberOfResolved = this.getGraphSubjectMemberOfFlat(item.memberOf);
                for (const subitem of memberOfResolved) {
                    map.set(`${id(subitem.member, subitem.container)}`, subitem);
                }
            }
        }

        return [...map.values()];
    }

    private getGraphSubjects(items: Array<{ group: GraphGroup, members: Array<GraphSubject> }>): Array<GraphSubject> {
        const map = new Map<string, GraphSubject>();

        for (const item of items) {
            if (item.group.descriptor !== undefined) {
                map.set(item.group.descriptor, item.group);
            }

            for (const member of item.members) {
                if (member.descriptor !== undefined) {
                    map.set(member.descriptor, member);
                }
            }
        }

        return [...map.values()];
    }

    private getHierarchy(member: GraphSubject, items: Array<{ group: GraphGroup, members: Array<GraphSubject> }>): GraphSubjectMemberOf {
        const collection = new Array<GraphGroup>();

        for (const item of items) {
            const memberIsWithinGroup = item.members.find(p => p.descriptor?.toLowerCase() === member.descriptor?.toLowerCase()) !== undefined;
            if (memberIsWithinGroup) {
                collection.push(item.group);
            }
        }

        return { graphSubject: member, memberOf: collection.map(p => this.getHierarchy(p, items)) };
    }

    private getSubjectDescriptors(items: Array<{ group: GraphGroup, graphMemberships: Array<GraphMembership> }>): Array<string> {
        const subjectDescriptors = new Set<string>();

        for (const item of items) {
            const containerDescriptors = item.graphMemberships.filter(p => p.containerDescriptor !== undefined).map(p => p.containerDescriptor!);
            const memberDescriptors    = item.graphMemberships.filter(p => p.memberDescriptor    !== undefined).map(p => p.memberDescriptor!   );

            for (const descriptor of containerDescriptors) { subjectDescriptors.add(descriptor); }
            for (const descriptor of memberDescriptors   ) { subjectDescriptors.add(descriptor); }
        }

        return [...subjectDescriptors];
    }

    private getGroupsWithMembers(groupsWithGraphMemberShips: Array<{ group: GraphGroup, graphMemberships: Array<GraphMembership> }>, graphSubjects: { [id: string]: GraphSubject; })
        : Array<{ group: GraphGroup, members: GraphSubject[] }> {
        const groupsWithMembers = new Array<{ group: GraphGroup, members: GraphSubject[] }>();

        for (const groupWithGraphMemberShips of groupsWithGraphMemberShips) {
            const item = { group: groupWithGraphMemberShips.group, members: new Array<GraphSubject>() };

            for (const graphMembership of groupWithGraphMemberShips.graphMemberships) {
                if (graphMembership.memberDescriptor !== undefined) {
                    const graphSubject = graphSubjects[graphMembership.memberDescriptor];

                    if (graphSubject === undefined) {
                        // todo
                    }
                    else {
                        item.members.push(graphSubject)
                    }
                }
            }

            groupsWithMembers.push(item);
        }

        return groupsWithMembers;
    }
}
