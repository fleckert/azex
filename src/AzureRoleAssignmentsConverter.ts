import { ActiveDirectoryUser                        } from "./models/ActiveDirectoryUser";
import { AzureRoleAssignment, AzureRoleAssignmentEx } from "./models/AzureRoleAssignment";
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
                principalName     : (p.principal as ActiveDirectoryUser).userPrincipalName ?? p.principal?.displayName
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
            if (p.principal?.type === 'User') {
                return {
                    scope             : `${p.roleAssignment.scope}`,
                    roleDefinitionId  : `${p.roleAssignment.roleDefinitionId}`,
                    principalId       : `${p.roleAssignment.principalId}`,
                    roleDefinitionName: p.roleDefinition.roleName,
                    principalType     : p.roleAssignment.principalType,
                    principalName     : (p.principal as ActiveDirectoryUser).userPrincipalName
                }
            }

            return {
                scope             : `${p.roleAssignment.scope}`,
                roleDefinitionId  : `${p.roleAssignment.roleDefinitionId}`,
                principalId       : `${p.roleAssignment.principalId}`,
                roleDefinitionName: p.roleDefinition.roleName,
                principalType     : p.roleAssignment.principalType,
                principalName     : p.principal?.displayName
            }
        })
    }

    mapExtendendEx(collection: Array<AzureRoleAssignmentEx>): Array<RbacDefinition> {
        return collection.map(p => {
            if(p.principal?.type === 'User'){
                return {
                    scope                     : `${p.roleAssignment.scope}`,
                    roleDefinitionId          : `${p.roleAssignment.roleDefinitionId}`,
                    principalId               : `${p.roleAssignment.principalId}`,
                    roleDefinitionName        : p.roleDefinition.roleName,
                    principalType             : p.roleAssignment.principalType,
                    principalName: (p.principal as ActiveDirectoryUser).userPrincipalName
                }
            }
            
            return {
                scope               : `${p.roleAssignment.scope}`,
                roleDefinitionId    : `${p.roleAssignment.roleDefinitionId}`,
                principalId         : `${p.roleAssignment.principalId}`,
                roleDefinitionName  : p.roleDefinition.roleName,
                principalType       : p.roleAssignment.principalType,
                principalName       : p.principal?.displayName,
                roleAssignmentStatus: p.roleAssignmentStatus
            }
        })
    }
}
