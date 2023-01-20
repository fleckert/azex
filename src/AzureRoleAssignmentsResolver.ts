import { ActiveDirectoryEntity           } from "./models/ActiveDirectoryEntity";
import { ActiveDirectoryGroup            } from "./models/ActiveDirectoryGroup";
import { ActiveDirectoryHelper           } from "./ActiveDirectoryHelper";
import { ActiveDirectoryServicePrincipal } from "./models/ActiveDirectoryServicePrincipal";
import { ActiveDirectoryUser             } from "./models/ActiveDirectoryUser";
import { AzureResourceId                 } from "./AzureResourceId";
import { AzureRoleAssignment             } from "./models/AzureRoleAssignment";
import { ManagementGroupInfo             } from "@azure/arm-managementgroups";
import { ManagementGroupsHelper          } from "./ManagementGroupsHelper";
import { RoleAssignment                  } from "@azure/arm-authorization/esm/models";
import { RoleAssignmentHelper            } from "./RoleAssignmentHelper";
import { RoleDefinition                  } from "@azure/arm-resources";
import { RoleDefinitionHelper            } from "./RoleDefinitionHelper";
import { SubscriptionClient              } from "@azure/arm-subscriptions";
import { TenantIdResolver                } from "./TenantIdResolver";
import { TokenCredential                 } from "@azure/identity";

export class AzureRoleAssignmentsResolver {
    async resolve(
        credentials   : TokenCredential, 
        subscriptionId: string
    ) : Promise<{roleAssignments : Array<AzureRoleAssignment>, failedRequests: Array<string>}> {
        const subscriptionClient            = new SubscriptionClient(credentials);

        const activeDirectoryHelper  = new ActiveDirectoryHelper (credentials                );
        const roleDefinitionHelper   = new RoleDefinitionHelper  (credentials, subscriptionId);
        const managementGroupsHelper = new ManagementGroupsHelper(credentials                );
        const roleAssignmentHelper   = new RoleAssignmentHelper  (credentials, subscriptionId);
        const tenantIdResolver       = new TenantIdResolver      (credentials                );

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

        const managementGroupIds  = Array.from(new Set(roleAssignments.filter(p => RoleAssignmentHelper.isManagementGroupScope(p)).map(p => p.scope!)));

        const roleDefinitionIds  = Array.from(new Set(roleAssignments.filter(p => p.roleDefinitionId !== undefined).map(p => p.roleDefinitionId!)));

        const roleDefinitions = roleDefinitionHelper.listAllForScopeById(`/subscriptions/${subscriptionId}`, roleDefinitionIds, []);

        const usersPromise             = activeDirectoryHelper.getUsersById            (userIds            );
        const groupsPromise            = activeDirectoryHelper.getGroupsById           (groupIds           );
        const servicePrincipalsPromise = activeDirectoryHelper.getServicePrincipalsById(servicePrincipalIds);
        const managementGroups         = managementGroupsHelper.getByIds(managementGroupIds);
        const tenantIdPromise          = tenantIdResolver.getTenantId();

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
            const principal : ActiveDirectoryEntity | undefined
                            = users            .find(p => p.id === principalId)
                           ?? groups           .find(p => p.id === principalId)
                           ?? servicePrincipals.find(p => p.id === principalId);

            const managementGroupInfo = managementGroupInfos.find(p => p.id?.toLowerCase() === scope?.toLowerCase());

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
