import { GraphGroup, GraphMember, GraphSubject } from "azure-devops-node-api/interfaces/GraphInterfaces";

export type GraphSubjectMemberOf = { graphSubject: GraphSubject, memberOf: Array<GraphSubjectMemberOf> };

export class AzureDevOpsPermissionsHierarchyResolver {

    getGraphSubjects(items: Array<{ group: GraphGroup, members: Array<GraphSubject> }>): Array<GraphSubject> {
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

    getHierarchy(member: GraphSubject, items: Array<{ group: GraphGroup, members: Array<GraphSubject> }>): GraphSubjectMemberOf {
        const collection = new Array<GraphGroup>();

        for (const item of items) {
            const memberIsWithinGroup = item.members.find(p => p.descriptor?.toLowerCase() === member.descriptor?.toLowerCase()) !== undefined;
            if (memberIsWithinGroup) {
                collection.push(item.group);
            }
        }

        return { graphSubject: member, memberOf: collection.map(p => this.getHierarchy(p, items)) };
    }

    flattenHierarchy(item: GraphSubjectMemberOf): Array<{ member: GraphMember, container: GraphMember }> {
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
}
