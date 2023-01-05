import { ActiveDirectoryGroup                     } from "./models/ActiveDirectoryGroup";
import { ActiveDirectoryHelper                    } from "./ActiveDirectoryHelper";
import { ActiveDirectoryPrincipal                 } from "./models/ActiveDirectoryPrincipal";
import { ActiveDirectoryServicePrincipal          } from "./models/ActiveDirectoryServicePrincipal";
import { ActiveDirectoryUser                      } from "./models/ActiveDirectoryUser";
import { AuthorizationManagementClient            } from "@azure/arm-authorization";
import { AzureResourceId                          } from "./AzureResourceId";
import { AzureRoleAssignment                      } from "./models/AzureRoleAssignment";
import { ManagementGroupInfo, ManagementGroupsAPI } from "@azure/arm-managementgroups";
import { ManagementGroupsHelper                   } from "./ManagementGroupsHelper";
import { RoleAssignment                           } from "@azure/arm-authorization/esm/models";
import { RoleAssignmentHelper                     } from "./RoleAssignmentHelper";
import { RoleDefinition                           } from "@azure/arm-resources";
import { RoleDefinitionHelper                     } from "./RoleDefinitionHelper";
import { SubscriptionClient, TenantIdDescription  } from "@azure/arm-subscriptions";
import { TenantsHelperJwtDecode                   } from "./TenantsHelperJwtDecode";
import { TokenCredential                          } from "@azure/identity";

export class AzureRoleAssignmentsResolver {
    async resolve(credential :TokenCredential, subscriptionId: string) 
    : Promise<{roleAssignments : Array<AzureRoleAssignment>, failedRequests: Array<string>}> {
        const authorizationManagementClient = new AuthorizationManagementClient(credential, subscriptionId);
        const managementGroupsAPI           = new ManagementGroupsAPI(credential);
        const subscriptionClient            = new SubscriptionClient(credential);

        const activeDirectoryHelper  = new ActiveDirectoryHelper (credential                   );
        const roleDefinitionHelper   = new RoleDefinitionHelper  (authorizationManagementClient);
        const managementGroupsHelper = new ManagementGroupsHelper(managementGroupsAPI          );
        const roleAssignmentHelper   = new RoleAssignmentHelper  (authorizationManagementClient);
        const tenantHelper           = new TenantsHelperJwtDecode(credential                   );

        const roleAssignments = await roleAssignmentHelper.listAllForScope(`/subscriptions/${subscriptionId}`);
    
        const userIds             = Array.from(new Set(roleAssignments.filter(p => p.principalType === 'User'             && p.principalId !== undefined).map(p => p.principalId!)));
        const groupIds            = Array.from(new Set(roleAssignments.filter(p => p.principalType === 'Group'            && p.principalId !== undefined).map(p => p.principalId!)));
        const servicePrincipalIds = Array.from(new Set(roleAssignments.filter(p => p.principalType === 'ServicePrincipal' && p.principalId !== undefined).map(p => p.principalId!)));

        const roleAssignmentsUnhandled = Array.from(
          new Set(
            roleAssignments
              .filter(
                p =>
                  p.principalType !== "User" &&
                  p.principalType !== "Group" &&
                  p.principalType !== "ServicePrincipal"
              )
          )
        );

        const failedRequests = new Array<string>();

        for (const roleAssignment of roleAssignmentsUnhandled) {
            failedRequests.push(`Unhandled roleAssignment, check roleAssignment.principalId[${roleAssignment.principalId}]`);
        }

        const managementGroupIds  = Array.from(new Set(roleAssignments.filter(p => p.scope !== undefined)
                                                                      .filter(p => p.scope!.startsWith('/providers/Microsoft.Management/managementGroups'))                                                                      
                                                                      .map(p => p.scope!)));

        const roleDefinitionIds  = Array.from(new Set(roleAssignments.filter(p => p.roleDefinitionId !== undefined).map(p => p.roleDefinitionId!)));

        const roleDefinitions = roleDefinitionHelper.listAllForScopeById(`/subscriptions/${subscriptionId}`, roleDefinitionIds);

        const usersPromise             = activeDirectoryHelper.getUsersById            (userIds            );
        const groupsPromise            = activeDirectoryHelper.getGroupsById           (groupIds           );
        const servicePrincipalsPromise = activeDirectoryHelper.getServicePrincipalsById(servicePrincipalIds);
        const managementGroups         = managementGroupsHelper.getByIds(managementGroupIds);
        const tenantIdPromise          =  tenantHelper.getTenantId();

        const usersResponses             = await usersPromise;
        const groupsResponses            = await groupsPromise;
        const servicePrincipalsResponses = await servicePrincipalsPromise;

        for (const item of usersResponses            .failedRequests) { failedRequests.push(`Azure Active Directory request failed [${item}]`); }
        for (const item of groupsResponses           .failedRequests) { failedRequests.push(`Azure Active Directory request failed [${item}]`); }
        for (const item of servicePrincipalsResponses.failedRequests) { failedRequests.push(`Azure Active Directory request failed [${item}]`); }

        const tenantId = await tenantIdPromise;
        if (tenantId === undefined) {
            throw new Error('tenantId === undefined')
        }

        const resolvedRoleAssignments = this.resolveRoleAssignments(
            roleAssignments, 
            await roleDefinitions, 
            usersResponses.items, 
            groupsResponses.items, 
            servicePrincipalsResponses.items,
            await managementGroups,
            subscriptionId,
            (await subscriptionClient.subscriptions.get(subscriptionId))?.displayName,
            tenantId
        ); 

        return { roleAssignments: resolvedRoleAssignments, failedRequests };
    }

    private resolveRoleAssignments(
        roleAssignments     : Array<RoleAssignment>,
        roleDefinitions     : Array<RoleDefinition>,
        users               : Array<ActiveDirectoryUser>,
        groups              : Array<ActiveDirectoryGroup>,
        servicePrincipals   : Array<ActiveDirectoryServicePrincipal>,
        managementGroupInfos: Array<ManagementGroupInfo>,
        subscriptionId      : string,
        subscriptionName    : string | undefined,
        tenantId            : string
    ): Array<AzureRoleAssignment> {
        const collection = new Array<AzureRoleAssignment>();

        for (const roleAssignment of roleAssignments) {
            const roleDefinitionId = roleAssignment.roleDefinitionId;
            const scope            = roleAssignment.scope;
            const principalId      = roleAssignment.principalId;
            const principalType    = roleAssignment.principalType;

            if (roleDefinitionId === undefined) { console.warn(`roleDefinitionId[${roleDefinitionId}] === undefined`); continue; }
            if (principalId      === undefined) { console.warn(`principalId[${     principalId     }] === undefined`); continue; }
            if (principalType    === undefined) { console.warn(`principalType[${   principalType   }] === undefined`); continue; }

            const roleDefinition = roleDefinitions.filter(p => p.id === roleDefinitionId)[0];
            const principal : ActiveDirectoryPrincipal
                            = users.filter(p => p.id === principalId)[0]
                           ?? groups.filter(p => p.id === principalId)[0]
                           ?? servicePrincipals.filter(p => p.id === principalId)[0];

            const managementGroupInfo = managementGroupInfos.filter(p => p.id === scope)[0];

            const resourceId = scope?.startsWith('/subscriptions/') || scope?.startsWith('subscriptions/')
                             ? new AzureResourceId(scope) 
                             : undefined;

            collection.push({
                principal,
                roleAssignment,
                roleDefinition,
                managementGroupInfo,
                subscriptionId,
                subscriptionName,
                tenantId
            });
        }

        return collection;
    }
}
