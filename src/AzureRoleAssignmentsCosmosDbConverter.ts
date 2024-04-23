import { ActiveDirectoryEntity                                      } from "./models/ActiveDirectoryEntity";
import { ActiveDirectoryUser                                        } from "./models/ActiveDirectoryUser";
import { AzureRoleAssignmentCosmosDb, AzureRoleAssignmentCosmosDbEx } from "./models/AzureRoleAssignmentCosmosDb";
import { RbacDefinition                                             } from "./models/RbacDefinition";

export class AzureRoleAssignmentsCosmosDbConverter {
    mapMinimal(collection: Array<AzureRoleAssignmentCosmosDb>): any {
        return collection.map(p => {
            return {
                scope               : `${p.roleAssignment.scope}`,
                roleDefinitionId    : `${p.roleAssignment.roleDefinitionId}`,
                principalId         : `${p.roleAssignment.principalId}`,
            }
        })
    }

    mapMinimalNoIds(collection: Array<AzureRoleAssignmentCosmosDb>): any {
        return collection.map(p => {
            return {
                scope             : p.roleAssignment.scope,
                roleDefinitionName: p.roleDefinition.roleName,
                principalType     : p.principal?.type,
                principalName     : this.getPrincipalName(p.principal),
            }
        })
    }

    mapMinimalEx(collection: Array<AzureRoleAssignmentCosmosDbEx>): any {
        return collection.map(p => {
            return {
                scope               : `${p.roleAssignment.scope}`,
                roleDefinitionId    : `${p.roleAssignment.roleDefinitionId}`,
                principalId         : `${p.roleAssignment.principalId}`,
                roleAssignmentStatus: p.roleAssignmentStatus
            }
        })
    }

    mapExtendend(collection: Array<AzureRoleAssignmentCosmosDb>): Array<RbacDefinition> {
        return collection.map(p => {
            return {
                scope             : `${p.roleAssignment.scope}`,
                roleDefinitionId  : `${p.roleAssignment.roleDefinitionId}`,
                principalId       : `${p.roleAssignment.principalId}`,
                roleDefinitionName: p.roleDefinition.roleName,
                principalType     : p.principal?.type,
                principalName     : this.getPrincipalName(p.principal),
                managementGroup   : undefined
            }
        })
    }

    mapExtendendEx(collection: Array<AzureRoleAssignmentCosmosDbEx>): Array<RbacDefinition> {
        return collection.map(p => {
            return {
                scope               : `${p.roleAssignment.scope}`,
                roleDefinitionId    : `${p.roleAssignment.roleDefinitionId}`,
                principalId         : `${p.roleAssignment.principalId}`,
                roleDefinitionName  : p.roleDefinition.roleName,
                principalType       : p.principal?.type,
                principalName       : this.getPrincipalName(p.principal),
                managementGroup     : undefined,
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
