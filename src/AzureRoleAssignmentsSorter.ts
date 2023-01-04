import { AzureRoleAssignment } from "./models/AzureRoleAssignment";

export class AzureRoleAssignmentsSorter {
    static sort(a: AzureRoleAssignment, b: AzureRoleAssignment) {
        const compareScope = `${a.roleAssignment.scope}`.toLowerCase().localeCompare(`${b.roleAssignment.scope}`.toLowerCase());

        if (compareScope !== 0) { return compareScope; }

        const compareRoleName = `${a.roleDefinition.roleName}`.toLowerCase().localeCompare(`${b.roleDefinition.roleName}`.toLowerCase());

        if (compareRoleName !== 0) { return compareRoleName; }

        const comparePrincipalType = `${a.principal?.type}`.toLowerCase().localeCompare(`${b.principal?.type}`.toLowerCase());

        if (comparePrincipalType !== 0) { return comparePrincipalType; }

        const comparePrincipalDisplayName = `${a.principal?.displayName}`.toLowerCase().localeCompare(`${b.principal?.displayName}`.toLowerCase());

        if (comparePrincipalDisplayName !== 0) { return comparePrincipalDisplayName; }

        return 0;
    }
}
