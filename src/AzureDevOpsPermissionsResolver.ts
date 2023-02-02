import { GraphGroup, GraphMember, GraphMembership, GraphSubject } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { AzureDevOpsHelper                                      } from "./AzureDevOpsHelper";


export class AzureDevOpsPermissionsResolver {
    async resolve(
        organization: string,
        projectName : string
    ): Promise<{ items: Array<{ group: GraphGroup, members: GraphSubject[] }> | undefined, error: Error | undefined }> {

        const azureDevOpsHelper =  new AzureDevOpsHelper();

        const groups = await azureDevOpsHelper.graphGroupsListForProjectName(organization, projectName);

        if (groups.error !== undefined) {
            return { items: undefined, error: groups.error };
        }
        else if (groups.value === undefined) {
            return { items: undefined, error: new Error('Failed to resolve groups.') };
        }
        else {
            const groupsWithGraphMemberShips = await this.getGroupsWithMemberships(azureDevOpsHelper, organization, groups.value);

            if (groupsWithGraphMemberShips.error !== undefined) {
                return { items: undefined, error: groupsWithGraphMemberShips.error };
            }
            else if (groupsWithGraphMemberShips.items === undefined) {
                return { items: undefined, error: new Error('Failed to resolve groupsWithGraphMemberShips.') };
            }
            else {
                const subjectDescriptors = this.getSubjectDescriptors(groupsWithGraphMemberShips.items);

                const graphSubjects = await azureDevOpsHelper.graphSubjectLookup(organization, subjectDescriptors);

                if (graphSubjects.error !== undefined) {
                    return { items: undefined, error: new Error(`Failed to resolve graphSubjects. [${graphSubjects.error}]`) };
                }
                else if (graphSubjects.value === undefined) {
                    return { items: undefined, error: new Error('graphSubjects.items === undefined') };
                }
                else {
                    const groupsWithMembers = this.getGroupsWithMembers(groupsWithGraphMemberShips.items, graphSubjects.value);

                    return { items: groupsWithMembers, error: undefined };
                }
            }
        }
    }

    getContainerMembersFlat(items: Array<{ container: GraphMember, members: GraphMember[] }>): Array<{ container: GraphMember, member: GraphMember }> {
        const collection = new Array<{ container: GraphMember, member: GraphMember }>();

        for (const item of items) {
            for (const member of item.members) {
                collection.push({
                    container: item.container,
                    member: member,
                });
            }
        }

        return collection;
    }

    private async getGroupsWithMemberships(azureDevOpsHelper: AzureDevOpsHelper, organization: string, groups: Array<GraphGroup>): Promise<{ items: Array<{ group: GraphGroup, graphMemberships: Array<GraphMembership> }> | undefined, error: Error | undefined }> {
        const groupsWithGraphMemberShips = new Array<{ group: GraphGroup, graphMemberships: Array<GraphMembership> }>();

        for (const group of groups) {
            if (group.descriptor === undefined) {
                return { items: undefined, error: new Error('group.descriptor === undefined') };
            }
            else {
                const memberships = await azureDevOpsHelper.graphMembershipsList(organization, group.descriptor, 'down');

                if (memberships.error !== undefined) {
                    return { items: undefined, error: memberships.error };
                }
                else if (memberships.value === undefined) {
                    return { items: undefined, error: new Error('Failed to resolve memberShips.') };
                }
                else {
                    groupsWithGraphMemberShips.push({
                        group,
                        graphMemberships: memberships.value
                    });
                }
            }
        }

        return { items: groupsWithGraphMemberShips, error: undefined };
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
