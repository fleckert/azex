import { ActiveDirectoryApplication                 } from "./models/ActiveDirectoryApplication";
import { ActiveDirectoryEntity                      } from "./models/ActiveDirectoryEntity";
import { ActiveDirectoryGroup                       } from "./models/ActiveDirectoryGroup";
import { ActiveDirectoryServicePrincipal            } from "./models/ActiveDirectoryServicePrincipal";
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
                ...{
                    scope             : `${p.roleAssignment.scope}`,
                    roleDefinitionId  : `${p.roleAssignment.roleDefinitionId}`,
                    principalId       : `${p.roleAssignment.principalId}`,
                    roleDefinitionName: p.roleDefinition.roleName,
                    principalType     : p.roleAssignment.principalType,
                    principalName     : this.getPrincipalName(p.principal),
                    managementGroup   : AzureRoleAssignmentHelper.getManagementGroupName(p)
                } ,
                ...this.getPrincipalProperties(p.principal)
            }
        })
    }

    mapExtendendEx(collection: Array<AzureRoleAssignmentEx>): Array<RbacDefinition> {
        return collection.map(p => {
            return {
                ...{
                    scope               : `${p.roleAssignment.scope}`,
                    roleDefinitionId    : `${p.roleAssignment.roleDefinitionId}`,
                    principalId         : `${p.roleAssignment.principalId}`,
                    roleDefinitionName  : p.roleDefinition.roleName,
                    principalType       : p.roleAssignment.principalType,
                    principalName       : this.getPrincipalName(p.principal),
                    managementGroup     : AzureRoleAssignmentHelper.getManagementGroupName(p),
                    roleAssignmentStatus: p.roleAssignmentStatus
                } ,
                ...this.getPrincipalProperties(p.principal)
            }
        })
    }

    private getPrincipalName(principal: ActiveDirectoryEntity | undefined): string | undefined {
        if (principal?.type === 'Application'     ) { return (principal as ActiveDirectoryApplication     ).appId            ; }
        if (principal?.type === 'Group'           ) { return (principal as ActiveDirectoryGroup           ).displayName      ; }
        if (principal?.type === 'ServicePrincipal') { return (principal as ActiveDirectoryServicePrincipal).appId            ; }
        if (principal?.type === 'User'            ) { return (principal as ActiveDirectoryUser            ).userPrincipalName; }

        return principal?.displayName;
    }

    private getPrincipalProperties(principal: ActiveDirectoryEntity | undefined): any | undefined{
        if (principal?.type === 'Application'     ) { return { displayName: (principal as ActiveDirectoryApplication     ).displayName, applicationId: (principal as ActiveDirectoryApplication     ).appId }; }
        if (principal?.type === 'Group'           ) { return undefined                                                                                                                                       ; }
        if (principal?.type === 'ServicePrincipal') { return { displayName: (principal as ActiveDirectoryServicePrincipal).displayName, applicationId: (principal as ActiveDirectoryServicePrincipal).appId }; }
        if (principal?.type === 'User'            ) { return { displayName: (principal as ActiveDirectoryUser            ).displayName                                                                      }; }

        return undefined;
    }
}
