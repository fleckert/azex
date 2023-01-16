import { ActiveDirectoryEntity                      } from "./models/ActiveDirectoryEntity";
import { ActiveDirectoryUser                        } from "./models/ActiveDirectoryUser";
import { AzureRoleAssignment, AzureRoleAssignmentEx, AzureRoleAssignmentHelper } from "./models/AzureRoleAssignment";
import { RbacDefinition                             } from "./models/RbacDefinition";

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

    mapMinimalNoIds(collection: Array<AzureRoleAssignment>): any {
        return collection.map(p => {
            return {
                scope             : p.roleAssignment.scope,
                roleDefinitionName: p.roleDefinition.roleName,
                principalType     : p.roleAssignment.principalType,
                principalName     : this.getPrincipalName(p.principal),
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

    mapExtendend(collection: Array<AzureRoleAssignment>): Array<RbacDefinition> {
        return collection.map(p => {
            return {
                scope             : `${p.roleAssignment.scope}`,
                roleDefinitionId  : `${p.roleAssignment.roleDefinitionId}`,
                principalId       : `${p.roleAssignment.principalId}`,
                roleDefinitionName: p.roleDefinition.roleName,
                principalType     : p.roleAssignment.principalType,
                principalName     : this.getPrincipalName(p.principal),
                managementGroup   : AzureRoleAssignmentHelper.getManagementGroupName(p)
            }
        })
    }

    mapExtendendEx(collection: Array<AzureRoleAssignmentEx>): Array<RbacDefinition> {
        return collection.map(p => {
            return {
                scope               : `${p.roleAssignment.scope}`,
                roleDefinitionId    : `${p.roleAssignment.roleDefinitionId}`,
                principalId         : `${p.roleAssignment.principalId}`,
                roleDefinitionName  : p.roleDefinition.roleName,
                principalType       : p.roleAssignment.principalType,
                principalName       : this.getPrincipalName(p.principal),
                managementGroup     : AzureRoleAssignmentHelper.getManagementGroupName(p),
                roleAssignmentStatus: p.roleAssignmentStatus
            }
        })
    }

    private getPrincipalName(principal: ActiveDirectoryEntity | undefined) : string | undefined{
        return principal?.type === 'User'
            ? (principal as ActiveDirectoryUser).userPrincipalName
            : principal?.displayName;
    }
}
