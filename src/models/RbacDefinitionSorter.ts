import {  RbacDefinitionEx } from "./RbacDefinition";

export class RbacDefinitionSorter {
    static sort(a: RbacDefinitionEx, b: RbacDefinitionEx) {
        const compareScope = `${a.scope}`.toLowerCase().localeCompare(`${b.scope}`.toLowerCase());

        if (compareScope !== 0) { return compareScope; }

        const compareRoleDefinitionName = `${a.roleDefinitionName}`.toLowerCase().localeCompare(`${b.roleDefinitionName}`.toLowerCase());

        if (compareRoleDefinitionName !== 0) { return compareRoleDefinitionName; }

        const comparePrincipalType = `${a.principalType}`.toLowerCase().localeCompare(`${b.principalType}`.toLowerCase());

        if (comparePrincipalType !== 0) { return comparePrincipalType; }

        const comparePrincipalDisplayName = `${a.principalDisplayName}`.toLowerCase().localeCompare(`${b.principalDisplayName}`.toLowerCase());

        if (comparePrincipalDisplayName !== 0) { return comparePrincipalDisplayName; }

        return 0;
    }
}
