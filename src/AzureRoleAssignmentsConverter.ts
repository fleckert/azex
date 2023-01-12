import { ActiveDirectoryPrincipal                   } from "./models/ActiveDirectoryPrincipal";
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
                managementGroup   : this.getManagementGroupInfo(p)
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
                managementGroup     : this.getManagementGroupInfo(p),
                roleAssignmentStatus: p.roleAssignmentStatus
            }
        })
    }

    private getPrincipalName(principal: ActiveDirectoryPrincipal | undefined) : string | undefined{
        return principal?.type === 'User'
            ? (principal as ActiveDirectoryUser).userPrincipalName
            : principal?.displayName;
    }

    private getManagementGroupInfo(item: AzureRoleAssignment): string | undefined {
        const managementGroupFromScope
            = item.roleAssignment.scope !== undefined && item.roleAssignment.scope.startsWith('/providers/Microsoft.Management/managementGroups/')
            ? item.roleAssignment.scope.replace('/providers/Microsoft.Management/managementGroups/', '')
            : undefined;

        const managementGroupText = item.managementGroupInfo?.displayName
                                 ?? managementGroupFromScope 
                                 ?? undefined;

        return managementGroupText;
    }
}
