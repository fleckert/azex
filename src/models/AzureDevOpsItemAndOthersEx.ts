import { GraphGroup, GraphMember, GraphUser } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { AzureDevOpsHelper                  } from "../AzureDevOpsHelper";
import { AzureDevOpsItemAndOthers           } from "./AzureDevOpsItemAndOthers";



export class AzureDevOpsItemAndOthersEx {
    readonly item  : GraphMember;
    readonly users : Array<GraphUser>;
    readonly others: Array<AzureDevOpsItemAndOthersEx>;

    constructor(
        itemAndOthers: AzureDevOpsItemAndOthers
    ) {
        this.item = itemAndOthers.item;
        this.users = new Array<GraphUser>();
        this.others = new Array<AzureDevOpsItemAndOthersEx>();

        for (const other of itemAndOthers.others) {
            if (AzureDevOpsHelper.isGraphUser(other.item)) {
                this.users.push(other.item);
            }
            else if (AzureDevOpsHelper.isGraphGroup(other.item)) {
                this.others.push(new AzureDevOpsItemAndOthersEx(other));
            }
            else {
                throw new Error(`unhandled subjectKind '${other.item.subjectKind}'`);
            }
        }
    }
    
    flatten(direction: 'up' | 'down') {
        return direction === 'up'
            ? this.flattenUp()
            : this.flattenDown();
    }

    private id(a: GraphMember, b: GraphMember) { return `${a.descriptor?.toLowerCase()}-${b.descriptor?.toLowerCase()}`; }

    private flattenUp(): Array<{ container: GraphMember; users: Array<GraphUser>; } | { container: GraphMember; group: GraphGroup; }> {
        const map = new Map<string, { container: GraphMember; users: Array<GraphUser>; } | { container: GraphMember; group: GraphGroup; }>();

        for (const otherGroup of this.others.filter(p => AzureDevOpsHelper.isGraphGroup(p.item))) {
            if (AzureDevOpsHelper.isGraphGroup(this.item)) {
                map.set(`${this.id(otherGroup.item, this.item)}`, { container: otherGroup.item, group: this.item });
            }
            else if (AzureDevOpsHelper.isGraphUser(this.item)) {
                map.set(`${this.id(otherGroup.item, this.item)}`, { container: otherGroup.item, users: [this.item] });
            }
            else {
                throw new Error(`Failed to resolve subjectKind '${this.item.subjectKind}'.`);
            }
            const otherGroupResolved = otherGroup.flattenUp();

            for (const item of otherGroupResolved) {
                if ('group' in item) {
                    map.set(`${this.id(item.container, item.group)}`, { container: item.container, group: item.group });
                }
                else if ('users' in item) {
                    map.set(`${item.container.descriptor}-users`, { container: item.container, users: item.users });
                }
                else {
                    throw new Error(`Unhandled object ${JSON.stringify(item, null, 2)}`);
                }
            }
        }

        return [...map.values()];
    }

    private flattenDown(): Array<{ container: GraphMember; users: Array<GraphUser>; } | { container: GraphMember; group: GraphGroup; }> {
        const map = new Map<string, { container: GraphMember; users: Array<GraphUser>; } | { container: GraphMember; group: GraphGroup; }>();

        if (this.users.length > 0) {
            map.set(`${this.item.descriptor}-users`, { container: this.item, users: this.users });
        }

        for (const itemOther of this.others) {
            if (itemOther.users.length > 0) {
                map.set(`${itemOther.item.descriptor}-users`, { container: itemOther.item, users: itemOther.users });
            }

            if (AzureDevOpsHelper.isGraphGroup(itemOther.item)) {
                map.set(`${this.id(this.item, itemOther.item)}`, { container: this.item, group: itemOther.item });
            }

            for (const other of itemOther.others) {
                if (AzureDevOpsHelper.isGraphGroup(other.item)) {
                    map.set(`${this.id(itemOther.item, other.item)}`, { container: itemOther.item, group: other.item });
                }
            }

            const thisOthersFlat = this.getFlatDown(itemOther.others);
            for (const thisOtherFlat of thisOthersFlat) {
                if('users' in thisOtherFlat  ){
                    map.set(`${thisOtherFlat.container.descriptor}-users`, thisOtherFlat);
                }
                else if('group' in thisOtherFlat  ){
                    map.set(`${this.id(thisOtherFlat.container, thisOtherFlat.group)}`, thisOtherFlat);
                }
                else{
                    throw new Error('Failed to handle object.');
                }
            }
        }

        return [...map.values()];
    }



    private getFlatDown(items: Array<AzureDevOpsItemAndOthersEx>): Array<{ container: GraphMember; users: Array<GraphUser>; } | { container: GraphMember; group: GraphGroup; }> {
        const map = new Map<string, { container: GraphMember; users: Array<GraphUser>; } | { container: GraphMember; group: GraphGroup; }>();

        for (const item of items) {

            if (item.users.length > 0) {
                map.set(`${item.item.descriptor}-users`, { container: item.item, users: item.users });
            }

            for (const itemOther of item.others) {
                if (AzureDevOpsHelper.isGraphGroup(itemOther.item)) {
                    map.set(`${this.id(item.item, itemOther.item)}`, { container: item.item, group: itemOther.item });
                }

                const itemOthersResolved = this.getFlatDown(itemOther.others);

                for (const itemOtherResolved of itemOthersResolved) {
                    if('users' in itemOtherResolved  ){
                        map.set(`${itemOtherResolved.container}-users`, itemOtherResolved);
                    }
                    else if('group' in itemOtherResolved  ){
                        map.set(`${this.id(itemOtherResolved.container, itemOtherResolved.group)}`, itemOtherResolved);
                    }
                    else{
                        throw new Error('Failed to handle object.');
                    }
                }
            }
        }

        return [...map.values()];
    }
}
