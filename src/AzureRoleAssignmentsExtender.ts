import { AuthorizationManagementClient } from "@azure/arm-authorization";
import { ActiveDirectoryHelper         } from "./ActiveDirectoryHelper";
import { RbacDefinition                } from "./models/RbacDefinition";
import { RoleDefinitionHelper          } from "./RoleDefinitionHelper";
import { TokenCredential               } from "@azure/identity";
import { ActiveDirectoryUser           } from "./models/ActiveDirectoryUser";
import { ActiveDirectoryGroup          } from "./models/ActiveDirectoryGroup";
import { ActiveDirectoryPrincipal      } from "./models/ActiveDirectoryPrincipal";

export class AzureRoleAssignmentsExtender {
    async extend(
        credential: TokenCredential, 
        subscriptionId: string, 
        rbacDefinitions: Array<RbacDefinition>
    ): Promise<Array<RbacDefinition>> {
        const authorizationManagementClient = new AuthorizationManagementClient(credential, subscriptionId);
        
        const principalIds         = new Set(rbacDefinitions.filter(p => p.principalId        !== undefined).map(p => p.principalId!     ));
        const roleDefinitionsIds   = new Set(rbacDefinitions.filter(p => p.roleDefinitionId   !== undefined).map(p => p.roleDefinitionId!));
        const roleDefinitionsNames = new Set(rbacDefinitions.filter(p => p.roleDefinitionName !== undefined).map(p => p.roleDefinitionName!));

        const principalUserNames             = new Set(rbacDefinitions.filter(p => p.principalName !== undefined && p.principalType?.toLowerCase() === 'user'            ).map(p => p.principalName!));
        const principalGroupNames            = new Set(rbacDefinitions.filter(p => p.principalName !== undefined && p.principalType?.toLowerCase() === 'group'           ).map(p => p.principalName!));
        const principalServicePrincipalNames = new Set(rbacDefinitions.filter(p => p.principalName !== undefined && p.principalType?.toLowerCase() === 'serviceprincipal').map(p => p.principalName!));

        const roleDefinitionsPromise = new RoleDefinitionHelper (authorizationManagementClient).listAllForScopeById(`/subscriptions/${subscriptionId}`, [...roleDefinitionsIds], [...roleDefinitionsNames]);
        const principalsByIdPromise      = new ActiveDirectoryHelper(credential).getPrincipalsbyId([...principalIds]);
        
        const principalsByUserNamesPromise             = new ActiveDirectoryHelper(credential).getUsersByUserPrincipalName      ([...principalUserNames            ]);
        const principalsByGroupNamesPromise            = new ActiveDirectoryHelper(credential).getGroupsByDisplayName           ([...principalGroupNames           ]);
        const principalsByServicePrincipalNamesPromise = new ActiveDirectoryHelper(credential).getServicePrincipalsByDisplayName([...principalServicePrincipalNames]);

        const principalsById      = await principalsByIdPromise;
        const roleDefinitions = await roleDefinitionsPromise;

        const principalsByUserNames             = await principalsByUserNamesPromise;
        const principalsByGroupNames            = await principalsByGroupNamesPromise;
        const principalsByServicePrincipalNames = await principalsByServicePrincipalNamesPromise;

        const collection = new Array<RbacDefinition>();

        for (const item of rbacDefinitions) {
            const principalById = principalsById.items.filter(p => item.principalId !== undefined && item.principalId?.toLowerCase() === p.id.toLowerCase())[0];

            const principalByName = principalById === undefined && item.principalName !== undefined && item.principalType !== undefined
                                  ? this.resolvePrincipal(item.principalName, item.principalType, principalsByUserNames.items, principalsByGroupNames.items, principalsByServicePrincipalNames.items)
                                  : undefined;


            const principal = principalById ?? principalByName;

            const roleDefinition = roleDefinitions.filter(p => item.roleDefinitionId   !== undefined && item.roleDefinitionId  .toLowerCase() === p.id?.      toLowerCase())[0]
                                ?? roleDefinitions.filter(p => item.roleDefinitionName !== undefined && item.roleDefinitionName.toLowerCase() === p.roleName?.toLowerCase())[0];


            collection.push({
                scope             : item.scope,
                roleDefinitionId  : item.roleDefinitionId ?? roleDefinition.id,
                principalId       : principal?.id,
                roleDefinitionName: item.roleDefinitionName ?? roleDefinition?.roleName,
                principalType     : principal?.type,
                principalName     : (principal as ActiveDirectoryUser)?.userPrincipalName ?? principal?.displayName
            });
        }

        return collection;
    }

    resolvePrincipal(
        principalName    : string,
        principalType    : string,
        users            : Array<ActiveDirectoryUser>,
        groups           : Array<ActiveDirectoryGroup>,
        serviceprincipals: Array<ActiveDirectoryPrincipal>
    ): ActiveDirectoryPrincipal | undefined {

        {
            const principal = principalType === 'User' ? users.filter(p => p.userPrincipalName.toLowerCase() === principalName.toLowerCase())[0] : undefined;
            if (principal !== undefined) { return principal; }
        }

        {
            const principal = principalType === 'Group' ? groups.filter(p => p.displayName.toLowerCase() === principalName.toLowerCase())[0] : undefined;
            if (principal !== undefined) { return principal; }
        }

        {
            const principal = principalType === 'ServicePrincipal' ? serviceprincipals.filter(p => p.displayName.toLowerCase() === principalName.toLowerCase())[0] : undefined;
            if (principal !== undefined) { return principal; }
        }

        return undefined;
    }
}