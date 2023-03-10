import { GraphMember } from "azure-devops-node-api/interfaces/GraphInterfaces";


export class AzureDevOpsItemAndOthers {
    constructor(
        readonly item: GraphMember,
        readonly others: Array<AzureDevOpsItemAndOthers>
    ) { }

    flatten(direction: 'up' | 'down') {
        return direction === 'up'
            ? this.flattenUp()
            : this.flattenDown();
    }

    private flattenUp(): Array<{ container: GraphMember; member: GraphMember; }> {
        const map = new Map<string, { container: GraphMember; member: GraphMember; }>();

        for (const itemOther of this.others) {
            map.set(`${this.id(this.item, itemOther.item)}`, { container: itemOther.item, member: this.item });
            const thisOthersFlat = this.getFlatUp(this.others);
            for (const thisOtherFlat of thisOthersFlat) {
                map.set(`${this.id(thisOtherFlat.container, thisOtherFlat.member)}`, thisOtherFlat);
            }
        }

        return [...map.values()];
    }

    private flattenDown(): Array<{ container: GraphMember; member: GraphMember; }> {
        const map = new Map<string, { member: GraphMember; container: GraphMember; }>();

        for (const itemOther of this.others) {
            map.set(`${this.id(this.item, itemOther.item)}`, { container: this.item, member: itemOther.item });
            const thisOthersFlat = this.getFlatDown(this.others);
            for (const thisOtherFlat of thisOthersFlat) {
                map.set(`${this.id(thisOtherFlat.container, thisOtherFlat.member)}`, thisOtherFlat);
            }
        }

        return [...map.values()];
    }

    private id(a: GraphMember, b: GraphMember) { return `${a.descriptor?.toLowerCase()}-${b.descriptor?.toLowerCase()}`; }

    private getFlatDown(items: Array<AzureDevOpsItemAndOthers>): Array<{ member: GraphMember; container: GraphMember; }> {
        const map = new Map<string, { member: GraphMember; container: GraphMember; }>();

        for (const item of items) {
            for (const itemOther of item.others) {
                map.set(`${this.id(item.item, itemOther.item)}`, { member: itemOther.item, container: item.item });
                const itemOthersResolved = this.getFlatDown(item.others);
                for (const itemOtherResolved of itemOthersResolved) {
                    map.set(`${this.id(itemOtherResolved.container, itemOtherResolved.member)}`, itemOtherResolved);
                }
            }
        }

        return [...map.values()];
    }

    private getFlatUp(items: Array<AzureDevOpsItemAndOthers>): Array<{ member: GraphMember; container: GraphMember; }> {
        const map = new Map<string, { member: GraphMember; container: GraphMember; }>();

        for (const item of items) {
            for (const itemOther of item.others) {
                map.set(`${this.id(item.item, itemOther.item)}`, { member: item.item, container: itemOther.item });
                const itemOthersResolved = this.getFlatUp(item.others);
                for (const itemOtherResolved of itemOthersResolved) {
                    map.set(`${this.id(itemOtherResolved.container, itemOtherResolved.member)}`, itemOtherResolved);
                }
            }
        }

        return [...map.values()];
    }
}
