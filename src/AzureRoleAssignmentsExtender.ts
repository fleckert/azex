import { AuthorizationManagementClient    } from "@azure/arm-authorization";
import { ActiveDirectoryHelper            } from "./ActiveDirectoryHelper";
import { RbacDefinition, RbacDefinitionEx } from "./models/RbacDefinition";
import { RoleDefinitionHelper             } from "./RoleDefinitionHelper";
import { TokenCredential                  } from "@azure/identity";

export class AzureRoleAssignmentsExtender {
    async extend(
        credential: TokenCredential, 
        subscriptionId: string, 
        rbacDefinitions: Array<RbacDefinition>
    ): Promise<Array<RbacDefinitionEx>> {
        const authorizationManagementClient = new AuthorizationManagementClient(credential, subscriptionId);
        
        const principalIds       = new Set(rbacDefinitions.map(p => p.principalId     ));
        const roleDefinitionsIds = new Set(rbacDefinitions.map(p => p.roleDefinitionId));

        const roleDefinitionsPromise = new RoleDefinitionHelper (authorizationManagementClient).listAllForScopeById(`/subscriptions/${subscriptionId}`, [...roleDefinitionsIds]);
        const principalsPromise      = new ActiveDirectoryHelper(credential).getPrincipalsbyId([...principalIds]);
        
        const principals      = await principalsPromise;
        const roleDefinitions = await roleDefinitionsPromise;

        const collection = new Array<RbacDefinitionEx>();

        for (const item of rbacDefinitions) {
            const principal      = principals.items.filter(p => item.principalId.toLowerCase() === p.id.toLowerCase())[0];
            const roleDefinition = roleDefinitions.filter(p => item.roleDefinitionId.toLowerCase() === p.id?.toLowerCase())[0];

            collection.push({
                scope               : item.scope,
                roleDefinitionId    : item.roleDefinitionId,
                principalId         : item.principalId,
                roleDefinitionName  : roleDefinition?.roleName,
                principalType       : principal?.type,
                principalDisplayName: principal?.displayName
            });
        }

        return collection;
    }
}