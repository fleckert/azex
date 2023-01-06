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