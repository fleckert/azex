import { AzureRoleAssignment, AzureRoleAssignmentEx } from "./models/AzureRoleAssignment";
import { RbacDefinitionEx } from "./models/RbacDefinition";

export class AzureRoleAssignmentsConverter {
    mapMinimal(collection: Array<AzureRoleAssignment>): any {
        return collection.map(p => {
            return {
                scope               : `${p.roleAssignment.scope}`,
                roleDefinitionId    : `${p.roleAssignment.roleDefinitionId}`,
                principalId         : `${p.roleAssignment.principalId}`,
            }
        })
    }

    mapMinimalEx(collection: Array<AzureRoleAssignmentEx>): any {
        return collection.map(p => {
            return {
                scope               : `${p.roleAssignment.scope}`,
                roleDefinitionId    : `${p.roleAssignment.roleDefinitionId}`,
                principalId         : `${p.roleAssignment.principalId}`,
                roleAssignmentStatus: p.roleAssignmentStatus
            }
        })
    }

    mapExtendend(collection: Array<AzureRoleAssignment>): any {
        return collection.map(p => {
            return {
                scope               : `${p.roleAssignment.scope}`,
                roleDefinitionId    : `${p.roleAssignment.roleDefinitionId}`,
                principalId         : `${p.roleAssignment.principalId}`,
                roleDefinitionName  : p.roleDefinition.roleName,
                principalType       : p.roleAssignment.principalType,
                principalDisplayName: p.principal?.displayName
            }
        })
    }

    mapExtendendEx(collection: Array<AzureRoleAssignmentEx>): Array<RbacDefinitionEx> {
        return collection.map(p => {
            return {
                scope               : `${p.roleAssignment.scope}`,
                roleDefinitionId    : `${p.roleAssignment.roleDefinitionId}`,
                principalId         : `${p.roleAssignment.principalId}`,
                roleDefinitionName  : p.roleDefinition.roleName,
                principalType       : p.roleAssignment.principalType,
                principalDisplayName: p.principal?.displayName,
                roleAssignmentStatus: p.roleAssignmentStatus
            }
        })
    }
}
