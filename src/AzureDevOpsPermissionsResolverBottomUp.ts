import { GraphGroup, GraphMember, GraphSubject } from "azure-devops-node-api/interfaces/GraphInterfaces";

export type GraphSubjectMemberOf = { graphSubject: GraphSubject, memberOf: Array<GraphSubjectMemberOf> };

export class AzureDevOpsPermissionsResolverBottomUp {
    getGraphContainerMemberHierarchies(items: Array<{ group: GraphGroup, members: Array<GraphSubject> }>): Array<GraphSubjectMemberOf> {
        const disctinctMembers = new Map<string, GraphSubject>();
        for (const item of items) {
            for (const member of item.members) {
                if (member.descriptor === undefined) {
                    continue;
                }
                disctinctMembers.set(member.descriptor, member);
            }
        }

        const collection = new Array<GraphSubjectMemberOf>();
        for (const member of disctinctMembers.values()) {
            if (member.descriptor === undefined) {
                continue;
            }            
            collection.push({ graphSubject: member, memberOf: [this.getParents(member, items)] });
        }

        // to remove the first level... ugly
        return collection.map(p => p.memberOf[0]);
    }

    getOneGraphSubjectMemberOfFlat(item: GraphSubjectMemberOf): Array<{ member: GraphMember, container: GraphMember }> {
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

    private getGraphSubjectMemberOfFlat1(items: Array<GraphSubjectMemberOf>): Array<{ member: GraphMember, container: GraphMember }> {
        const collection = new Array<{ member: GraphMember, container: GraphMember }>();

        for (const item of items) {
            for (const memberOf of item.memberOf) {
                collection.push({ member: item.graphSubject, container: memberOf.graphSubject });
                const memberOfResolved = this.getGraphSubjectMemberOfFlat(item.memberOf);
                collection.push(...memberOfResolved);
            }
        }

        return collection;
    }

    private getParents(member: GraphSubject, items: Array<{ group: GraphGroup, members: Array<GraphSubject> }>): GraphSubjectMemberOf {
        const collection = new Array<GraphGroup>();

        for (const item of items) {
            const memberIsWithinGroup = item.members.find(p => p.descriptor?.toLowerCase() === member.descriptor?.toLowerCase()) !== undefined;
            if (memberIsWithinGroup) {
                collection.push(item.group);
            }
        }

        return { graphSubject: member, memberOf: collection.map(p => this.getParents(p, items)) };
    }
}
