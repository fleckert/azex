import {  RoleAssignment,  RoleDefinition } from "@azure/arm-authorization/esm/models";
import { ActiveDirectoryGroup             } from "./ActiveDirectoryGroup";
import { ActiveDirectoryServicePrincipal  } from "./ActiveDirectoryServicePrincipal";
import { ActiveDirectoryUser              } from "./ActiveDirectoryUser";
import { ManagementGroupInfo              } from "@azure/arm-managementgroups";

export interface AzureRoleAssignment {
    roleAssignment     : RoleAssignment;
    roleDefinition     : RoleDefinition;
    principal          : ActiveDirectoryUser | ActiveDirectoryGroup | ActiveDirectoryServicePrincipal | undefined;
    managementGroupInfo: ManagementGroupInfo | undefined;
    subscriptionId     : string;
    subscriptionName   : string              | undefined;
    tenantId           : string;
}

export interface AzureRoleAssignmentEx extends AzureRoleAssignment {
    roleAssignmentStatus: AzureRoleAssignmentStatus | undefined;
}

export type AzureRoleAssignmentStatus = 'okay' | 'missing-rbac'| 'missing-resource' | 'unexpected-rbac'

export class AzureRoleAssignmentHelper {
    static getManagementGroupName(item: AzureRoleAssignment): string | undefined {
        const managementGroupFromScope
            = item.roleAssignment.scope !== undefined && item.roleAssignment.scope.startsWith('/providers/Microsoft.Management/managementGroups/')
            ? item.roleAssignment.scope.replace('/providers/Microsoft.Management/managementGroups/', '')
            : undefined;

        const managementGroupText
            = item.managementGroupInfo?.displayName
            ?? managementGroupFromScope
            ?? undefined;

        return managementGroupText;
    }

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
