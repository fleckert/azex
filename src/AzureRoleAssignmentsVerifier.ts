import { ActiveDirectoryHelper        } from "./ActiveDirectoryHelper";
import { AzureRoleAssignmentEx        } from "./models/AzureRoleAssignment";
import { AzureRoleAssignmentsResolver } from "./AzureRoleAssignmentsResolver";
import { RbacDefinition               } from "./models/RbacDefinition";
import { ResourceManagementClient     } from "@azure/arm-resources";
import { ResourcesHelper              } from "./ResourcesHelper";
import { RoleDefinitionHelper         } from "./RoleDefinitionHelper";
import { SubscriptionClient           } from "@azure/arm-subscriptions";
import { TenantIdResolver             } from "./TenantIdResolver";
import { TokenCredential              } from "@azure/identity";

export class AzureRoleAssignmentsVerifier {
    async verify(
        credential     : TokenCredential,
        subscriptionId : string,
        rbacDefinitions: Array<RbacDefinition>
    ): Promise<Array<AzureRoleAssignmentEx>> {
        const resourceManagementClient      = new ResourceManagementClient     (credential, subscriptionId);

        const scopes             = new Set(rbacDefinitions.map(p => p.scope           ));
        const principalIds       = new Set(rbacDefinitions.filter(p => p.principalId      !== undefined).map(p => p.principalId!     ));
        const roleDefinitionsIds = new Set(rbacDefinitions.filter(p => p.roleDefinitionId !== undefined).map(p => p.roleDefinitionId!));

        const resourcesPromise            = new ResourcesHelper       (resourceManagementClient).getByIds([...scopes]);
        const roleDefinitionsByIdsPromise = new RoleDefinitionHelper  (credential, subscriptionId).listAllForScopeById(`/subscriptions/${subscriptionId}`, [...roleDefinitionsIds], []);
        const principalsByIdsPromise      = new ActiveDirectoryHelper (credential).getPrincipalsbyId([...principalIds]);
        const subscriptionPromise         = new SubscriptionClient    (credential).subscriptions.get(subscriptionId);
        const tenantIdPromise             = new TenantIdResolver      (credential).getTenantId();

        const roleAssignmentsEx = await new AzureRoleAssignmentsResolver().resolve(credential, subscriptionId);

        const resources            = await resourcesPromise;
        const principalsByIds      = await principalsByIdsPromise;
        const roleDefinitionsByIds = await roleDefinitionsByIdsPromise;
        const subscription         = await subscriptionPromise;
        const tenantId             = await tenantIdPromise;

        if (tenantId === undefined) {
            throw new Error('tenantId === undefined')
        }

        const roleAssignmentEx = new Array<AzureRoleAssignmentEx>();

        for (const roleAssignment of roleAssignmentsEx.roleAssignments) {
            const isPlanned = rbacDefinitions.find(p => {
                return p.principalId      !== undefined && p.principalId     .toLowerCase() === roleAssignment.roleAssignment?.principalId?.     toLowerCase()
                    && p.roleDefinitionId !== undefined && p.roleDefinitionId.toLowerCase() === roleAssignment.roleAssignment?.roleDefinitionId?.toLowerCase()
                    &&                                     p.scope           .toLowerCase() === roleAssignment.roleAssignment?.scope?.           toLowerCase();
            }) !== undefined;

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
            if (roleAssignmentEx.find(p => {
                return rbacDefinition.principalId      !== undefined && rbacDefinition.principalId     .toLowerCase() === p.roleAssignment?.principalId?.     toLowerCase()
                    && rbacDefinition.roleDefinitionId !== undefined && rbacDefinition.roleDefinitionId.toLowerCase() === p.roleAssignment?.roleDefinitionId?.toLowerCase()
                    &&                                                  rbacDefinition.scope           .toLowerCase() === p.roleAssignment?.scope?.           toLowerCase();
            }) === undefined) {
                const principal = principalsByIds.items.find(p => p.id.toLowerCase() === rbacDefinition.principalId?.toLowerCase());

                const resourceExists = resources.items.some(p => `${p.id}`.toLowerCase() === rbacDefinition.scope.toLowerCase());

                roleAssignmentEx.push({
                    roleAssignment: {
                        principalId     : principal?.id,
                        principalType   : principal?.type,
                        roleDefinitionId: rbacDefinition.roleDefinitionId,
                        scope           : rbacDefinition.scope
                    },
                    roleDefinition      : roleDefinitionsByIds.filter(p => rbacDefinition.roleDefinitionId!== undefined && p.id?.toLowerCase() === rbacDefinition.roleDefinitionId?.toLowerCase())[0],
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