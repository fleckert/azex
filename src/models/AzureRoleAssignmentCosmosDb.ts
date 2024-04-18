import { AzureRoleAssignmentStatus                                } from "./AzureRoleAssignment";
import { ActiveDirectoryGroup                                     } from "./ActiveDirectoryGroup";
import { ActiveDirectoryServicePrincipal                          } from "./ActiveDirectoryServicePrincipal";
import { ActiveDirectoryUser                                      } from "./ActiveDirectoryUser";
import { SqlRoleAssignmentGetResults, SqlRoleDefinitionGetResults } from "@azure/arm-cosmosdb";

export interface AzureRoleAssignmentCosmosDb {
    roleAssignment     : SqlRoleAssignmentGetResults;
    roleDefinition     : SqlRoleDefinitionGetResults;
    principal          : ActiveDirectoryUser | ActiveDirectoryGroup | ActiveDirectoryServicePrincipal | undefined;
    resourceGroupName  : string;
    accountName        : string;
    subscriptionId     : string;
    subscriptionName   : string | undefined;
    tenantId           : string;
}

export interface AzureRoleAssignmentCosmosDbEx extends AzureRoleAssignmentCosmosDb {
    roleAssignmentStatus: AzureRoleAssignmentStatus | undefined;
}

export class AzureRoleAssignmentCosmosDbHelper {
    static sort(a: AzureRoleAssignmentCosmosDb, b: AzureRoleAssignmentCosmosDb) {
        const compareResourceGroupName = `${a.resourceGroupName}`.toLowerCase().localeCompare(`${b.resourceGroupName}`.toLowerCase());

        if (compareResourceGroupName !== 0) { return compareResourceGroupName; }

        const compareAccountName= `${a.accountName}`.toLowerCase().localeCompare(`${b.accountName}`.toLowerCase());

        if (compareAccountName !== 0) { return compareAccountName; }

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
