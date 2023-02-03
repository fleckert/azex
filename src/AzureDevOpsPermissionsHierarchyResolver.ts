import { GraphGroup, GraphMember, GraphMembership, GraphSubject } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { AzureDevOpsHelper                                      } from "./AzureDevOpsHelper";

export type GraphSubjectMemberOf = { graphSubject: GraphSubject, memberOf: Array<GraphSubjectMemberOf> };

export class AzureDevOpsPermissionsHierarchyResolver {

    async resolveGraphSubjectMemberOf(
        organization     : string,
        projectName      : string,
        subjectDescriptor: string
    ): Promise<{ value: GraphSubjectMemberOf | undefined, error: Error | undefined }> {

        const azureDevOpsHelper = new AzureDevOpsHelper();

        const graphSubject = await azureDevOpsHelper.graphSubjectLookup(organization, subjectDescriptor);

        if (graphSubject.error !== undefined) {
            return { value: undefined, error: graphSubject.error };
        }
        if (graphSubject.value === undefined) {
            return { value: undefined, error: new Error(`Failed to resolve graphSubject for organization[${organization}] projectName[${projectName}] subjectDescriptor[${subjectDescriptor}].`) };
        }
        else {
            const groups = await azureDevOpsHelper.graphGroupsListForProjectName(organization, projectName);

            if (groups.error !== undefined) {
                return { value: undefined, error: groups.error };
            }
            else if (groups.value === undefined) {
                return { value: undefined, error: new Error(`Failed to resolve groups for organization[${organization}] projectName[${projectName}].`) };
            }
            else {
                const groupsWithMemberships = await this.getGroupsWithMemberships(azureDevOpsHelper, organization, groups.value);

                if (groupsWithMemberships.error !== undefined) {
                    return { value: undefined, error: groups.error };
                }
                else if (groupsWithMemberships.value === undefined) {
                    return { value: undefined, error: new Error(`Failed to resolve groupsWithMemberships for organization[${organization}].`) };
                }
                else {
                    const graphSubjectMemberOf = this.getGraphSubjectMemberOf(graphSubject.value, groupsWithMemberships.value);

                    return { value: graphSubjectMemberOf, error: groups.error };
                }
            }
        }

    }

    toGraphSubjectMemberOf(items: Array<{ group: GraphGroup, members: Array<GraphSubject> }>): Array<GraphSubjectMemberOf> {
        return this.getGraphSubjects(items).map(p => this.getHierarchy(p, items));
    }
    
    flattenGraphSubjectMemberOf(item: GraphSubjectMemberOf): Array<{ member: GraphMember, container: GraphMember }> {
        const id = (member: GraphMember, container: GraphMember) => `${member.descriptor?.toLowerCase()}-${container.descriptor?.toLowerCase()}`;

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

    private async getGroupsWithMemberships(azureDevOpsHelper: AzureDevOpsHelper, organization: string, groups: Array<GraphGroup>): Promise<{ value: Array<{ group: GraphGroup, graphMemberships: Array<GraphMembership> }> | undefined, error: Error | undefined }> {
        const groupsWithGraphMemberShips = new Array<{ group: GraphGroup, graphMemberships: Array<GraphMembership> }>();

        for (const group of groups) {
            if (group.descriptor === undefined) {
                return { value: undefined, error: new Error('group.descriptor === undefined') };
            }
            else {
                const memberships = await azureDevOpsHelper.graphMembershipsList(organization, group.descriptor, 'down');

                if (memberships.error !== undefined) {
                    return { value: undefined, error: memberships.error };
                }
                else if (memberships.value === undefined) {
                    return { value: undefined, error: new Error('Failed to resolve memberShips.') };
                }
                else {
                    groupsWithGraphMemberShips.push({
                        group,
                        graphMemberships: memberships.value
                    });
                }
            }
        }

        return { value: groupsWithGraphMemberShips, error: undefined };
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
}
