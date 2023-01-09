import {  RbacDefinitionEx } from "./RbacDefinition";

export class RbacDefinitionSorter {
    static sort(a: RbacDefinitionEx, b: RbacDefinitionEx) {
        const compareScope = `${a.scope}`.toLowerCase().localeCompare(`${b.scope}`.toLowerCase());

        if (compareScope !== 0) { return compareScope; }

        const compareRoleDefinitionName = `${a.roleDefinitionName}`.toLowerCase().localeCompare(`${b.roleDefinitionName}`.toLowerCase());

        if (compareRoleDefinitionName !== 0) { return compareRoleDefinitionName; }

        const comparePrincipalType = `${a.principalType}`.toLowerCase().localeCompare(`${b.principalType}`.toLowerCase());

        if (comparePrincipalType !== 0) { return comparePrincipalType; }

        const comparePrincipalName = `${a.principalName}`.toLowerCase().localeCompare(`${b.principalName}`.toLowerCase());

        if (comparePrincipalName !== 0) { return comparePrincipalName; }

        return 0;
    }
}
