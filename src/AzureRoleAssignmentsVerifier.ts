import { AuthorizationManagementClient } from "@azure/arm-authorization";
import { ResourceManagementClient      } from "@azure/arm-resources";
import { SubscriptionClient            } from "@azure/arm-subscriptions";
import { ActiveDirectoryHelper         } from "./ActiveDirectoryHelper";
import { AzureRoleAssignmentsResolver  } from "./AzureRoleAssignmentsResolver";
import { AzureRoleAssignmentEx         } from "./models/AzureRoleAssignment";
import { RbacDefinition                } from "./models/RbacDefinition";
import { ResourcesHelper               } from "./ResourcesHelper";
import { RoleDefinitionHelper          } from "./RoleDefinitionHelper";
import { TenantsHelperJwtDecode        } from "./TenantsHelperJwtDecode";
import { TokenCredential               } from "@azure/identity";

export class AzureRoleAssignmentsVerifier {
    async verify(credential :TokenCredential, subscriptionId: string, rbacDefinitions: Array<RbacDefinition>) : Promise<Array<AzureRoleAssignmentEx>>{
        const authorizationManagementClient = new AuthorizationManagementClient(credential, subscriptionId);
        const resourceManagementClient      = new ResourceManagementClient     (credential, subscriptionId);

        const principalIds       = new Set(rbacDefinitions.map(p => p.principalId     ));
        const scopes             = new Set(rbacDefinitions.map(p => p.scope           ));
        const roleDefinitionsIds = new Set(rbacDefinitions.map(p => p.roleDefinitionId));

        const resourcesPromise       = new ResourcesHelper       (resourceManagementClient).getByIds([...scopes]);
        const roleDefinitionsPromise = new RoleDefinitionHelper  (authorizationManagementClient).listAllForScopeById(`/subscriptions/${subscriptionId}`, [...roleDefinitionsIds]);
        const principalsPromise      = new ActiveDirectoryHelper (credential).getPrincipalsbyId([...principalIds]);
        const subscriptionPromise    = new SubscriptionClient    (credential).subscriptions.get(subscriptionId);
        const tenantIdPromise        = new TenantsHelperJwtDecode(credential).getTenantId();

        const roleAssignmentsEx = await new AzureRoleAssignmentsResolver().resolve(credential, subscriptionId);

        const resources       = await resourcesPromise;
        const principals      = await principalsPromise;
        const roleDefinitions = await roleDefinitionsPromise;
        const subscription    = await subscriptionPromise;
        const tenantId        = await tenantIdPromise;

        if (tenantId === undefined) {
            throw new Error('tenantId === undefined')
        }

        const roleAssignmentEx = new Array<AzureRoleAssignmentEx>();

        for (const roleAssignment of roleAssignmentsEx.roleAssignments) {
            const isPlanned = rbacDefinitions.filter(p => {
                return p.principalId     .toLowerCase() === roleAssignment.roleAssignment?.principalId?.     toLowerCase()
                    && p.roleDefinitionId.toLowerCase() === roleAssignment.roleAssignment?.roleDefinitionId?.toLowerCase()
                    && p.scope           .toLowerCase() === roleAssignment.roleAssignment?.scope?.           toLowerCase();
            })[0] !== undefined;

            roleAssignmentEx.push({
                roleAssignment      : roleAssignment.roleAssignment,
                roleDefinition      : roleAssignment.roleDefinition,
                principal           : roleAssignment.principal,
                managementGroupInfo : roleAssignment.managementGroupInfo,
                subscriptionId      : roleAssignment.subscriptionId,
                subscriptionName    : roleAssignment.subscriptionName,
                tenantId            : roleAssignment.tenantId,
                roleAssignmentStatus: isPlanned ? 'okay' : 'unexpected-rbac'
            });
        }

        for (const rbacDefinition of rbacDefinitions) {
            if (roleAssignmentEx.filter(p => {
                return rbacDefinition.principalId     .toLowerCase() === p.roleAssignment?.principalId?.     toLowerCase()
                    && rbacDefinition.roleDefinitionId.toLowerCase() === p.roleAssignment?.roleDefinitionId?.toLowerCase()
                    && rbacDefinition.scope           .toLowerCase() === p.roleAssignment?.scope?.           toLowerCase();
            })[0] === undefined) {
                const principal = principals.items.filter(p => p.id.toLowerCase() === rbacDefinition.principalId.toLowerCase())[0];

                const resourceExists = resources.items.filter(p => `${p.id}`.toLowerCase() === rbacDefinition.scope.toLowerCase())[0] !== undefined;

                roleAssignmentEx.push({
                    roleAssignment: {
                        principalId     : principal.id,
                        principalType   : principal.type,
                        roleDefinitionId: rbacDefinition.roleDefinitionId,
                        scope           : rbacDefinition.scope
                    },
                    roleDefinition      : roleDefinitions.filter(p => p.id?.toLowerCase() === rbacDefinition.roleDefinitionId.toLowerCase())[0],
                    principal           : principal,
                    managementGroupInfo : undefined,
                    subscriptionId      : subscriptionId,
                    subscriptionName    : subscription.displayName,
                    tenantId            : tenantId,
                    roleAssignmentStatus: resourceExists ? 'missing-rbac' : 'missing-resource'
                });
            }
        }

        return roleAssignmentEx;
    }
}