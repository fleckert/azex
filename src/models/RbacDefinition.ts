export interface RbacDefinition {
    scope              : string;
    principalId        : string | undefined;
    roleDefinitionId   : string | undefined;
    roleDefinitionName : string | undefined;
    principalType      : string | undefined;
    principalName      : string | undefined;
}

export class RbacDefinitionHelper{
    static sort(a: RbacDefinition, b: RbacDefinition) {
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

    static isEqualCaseInsensitiveIds(a: RbacDefinition, b: RbacDefinition) {
        if(a.scope.            toLowerCase() !== b.scope.            toLowerCase()) { return false; }
        if(a.principalId?.     toLowerCase() !== b.principalId?.     toLowerCase()) { return false; }
        if(a.roleDefinitionId?.toLowerCase() !== b.roleDefinitionId?.toLowerCase()) { return false; }
            
        return true;
    }

    static isEqualCaseInsensitive(a: RbacDefinition, b: RbacDefinition) {
        if(a.scope.              toLowerCase() !== b.scope.              toLowerCase()) { return false; }
        if(a.principalId?.       toLowerCase() !== b.principalId?.       toLowerCase()) { return false; }
        if(a.roleDefinitionId?.  toLowerCase() !== b.roleDefinitionId?.  toLowerCase()) { return false; }
        if(a.roleDefinitionName?.toLowerCase() !== b.roleDefinitionName?.toLowerCase()) { return false; }
        if(a.principalType?.     toLowerCase() !== b.principalType?.     toLowerCase()) { return false; }
        if(a.principalName?.     toLowerCase() !== b.principalName?.     toLowerCase()) { return false; }

        return true;
    }
}