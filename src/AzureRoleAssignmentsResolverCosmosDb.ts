import { ActiveDirectoryEntity                                 } from "./models/ActiveDirectoryEntity";
import { ActiveDirectoryGroup                                  } from "./models/ActiveDirectoryGroup";
import { ActiveDirectoryHelper                                 } from "./ActiveDirectoryHelper";
import { ActiveDirectoryServicePrincipal                       } from "./models/ActiveDirectoryServicePrincipal";
import { ActiveDirectoryUser                                   } from "./models/ActiveDirectoryUser";
import { AzureRoleAssignmentCosmosDb                           } from "./models/AzureRoleAssignmentCosmosDb";
import { CosmosDBManagementClient, SqlRoleDefinitionGetResults } from "@azure/arm-cosmosdb";
import { ResourceManagementClient                              } from "@azure/arm-resources";
import { RoleDefinition                                        } from "@azure/arm-authorization/esm/models";
import { SubscriptionClient                                    } from "@azure/arm-subscriptions";
import { TenantIdResolver                                      } from "./TenantIdResolver";
import { TokenCredential                                       } from "@azure/identity";

export class AzureRoleAssignmentsResolverCosmosDb {
    async resolve(
        credentials   : TokenCredential, 
        subscriptionId: string
    ) : Promise<{roleAssignments : Array<AzureRoleAssignmentCosmosDb>, failedRequests: Array<string>}> {
        const subscriptionClient    = new SubscriptionClient   (credentials);
        const activeDirectoryHelper = new ActiveDirectoryHelper(credentials);
        const tenantIdResolver      = new TenantIdResolver     (credentials);
 
        const tenantIdPromise = tenantIdResolver.getTenantId();

        const sqlRoleDefinitionAssignments = await this.resolveSqlRoleDefinitionAssignments(credentials, subscriptionId);
       
        const principalIds = sqlRoleDefinitionAssignments.map(p => p.principalId);

        const usersPromise             = activeDirectoryHelper.getUsersById            (principalIds);
        const groupsPromise            = activeDirectoryHelper.getGroupsById           (principalIds);
        const servicePrincipalsPromise = activeDirectoryHelper.getServicePrincipalsById(principalIds);

        const usersResponses             = await usersPromise;
        const groupsResponses            = await groupsPromise;
        const servicePrincipalsResponses = await servicePrincipalsPromise;

        const principalIdsUnresolved = new Array<string>();

        for (const principalId of principalIds) {
            const user             = usersResponses            .items.find(p => p.id === principalId);
            const group            = groupsResponses           .items.find(p => p.id === principalId);
            const servicePrincipal = servicePrincipalsResponses.items.find(p => p.id === principalId);

            if (user === undefined && group === undefined && servicePrincipal === undefined) {
                if (principalIdsUnresolved.find(p => p === principalId) === undefined) {
                    principalIdsUnresolved.push(principalId);
                }
            }
        }

        const failedRequests = new Array<string>();

        for (const principalId of principalIdsUnresolved) {
            failedRequests.push(`Unhandled roleAssignment, check principalId[${principalId}]`);
        }

        const tenantId = await tenantIdPromise;
        
        if (tenantId === undefined) {
            throw new Error('tenantId === undefined')
        }

        const resolvedRoleAssignments = this.resolveRoleAssignments(
            sqlRoleDefinitionAssignments, 
            usersResponses.items,
            groupsResponses.items,
            servicePrincipalsResponses.items, 
            subscriptionId,
            (await subscriptionClient.subscriptions.get(subscriptionId))?.displayName,
            tenantId
        );

        return { roleAssignments: resolvedRoleAssignments, failedRequests };
    }

    private resolveRoleAssignments(
        roleAssignments     : Array<SqlRoleDefinitionAssignment>, 
        users               : Array<ActiveDirectoryUser>,
        groups              : Array<ActiveDirectoryGroup>,
        servicePrincipals   : Array<ActiveDirectoryServicePrincipal>, 
        subscriptionId      : string,
        subscriptionName    : string | undefined,
        tenantId            : string
    ): Array<AzureRoleAssignmentCosmosDb> {
        const collection = new Array<AzureRoleAssignmentCosmosDb>();

        for (const roleAssignment of roleAssignments) {
            const roleDefinitionId = roleAssignment.roleDefinitionId;
            const scope            = roleAssignment.scope;
            const principalId      = roleAssignment.principalId;

            const principal : ActiveDirectoryEntity | undefined
                            = users            .find(p => p.id === principalId)
                           ?? groups           .find(p => p.id === principalId)
                           ?? servicePrincipals.find(p => p.id === principalId);


            if (roleDefinitionId === undefined) { console.warn(`roleDefinitionId[${roleDefinitionId}] === undefined`); continue; }
            if (principalId      === undefined) { console.warn(`principalId[${     principalId     }] === undefined`); continue; }
             
            const roleDefinition : RoleDefinition = {
                id              : roleAssignment.sqlRoleDefinitionGetResult.id,
                name            : roleAssignment.sqlRoleDefinitionGetResult.name,
                type            : roleAssignment.sqlRoleDefinitionGetResult.type,
                roleType        : roleAssignment.sqlRoleDefinitionGetResult.typePropertiesType,
                description     : '',
                permissions     : roleAssignment.sqlRoleDefinitionGetResult.permissions,
                assignableScopes: roleAssignment.sqlRoleDefinitionGetResult.assignableScopes
            }
 
            collection.push({
                roleAssignment,
                roleDefinition   : roleAssignment.sqlRoleDefinitionGetResult,
                principal,
                resourceGroupName: roleAssignment.resourceGroupName,
                accountName      : roleAssignment.accountName,
                subscriptionId,
                subscriptionName,
                tenantId
            });
        }

        return collection;
    }

    private async resolveSqlRoleDefinitionAssignments(
        credentials   : TokenCredential, 
        subscriptionId: string
    ) : Promise<Array<SqlRoleDefinitionAssignment>> {
        const cosmosDBManagementClient = new CosmosDBManagementClient(credentials, subscriptionId);

        const resourceManagementClient = new ResourceManagementClient(credentials, subscriptionId);

        const sqlRoleDefinitionAssignments = new Array<SqlRoleDefinitionAssignment>();

        const resourcesCosmosDb = resourceManagementClient.resources.list({ filter: "resourceType eq 'Microsoft.DocumentDB/databaseAccounts'" });

        for await (const resource of resourcesCosmosDb) {
            
            const accountName       = resource.name;
            const resourceGroupName = resource.id?.split('/')[4];

            if (accountName       === undefined) { continue; }
            if (resourceGroupName === undefined) { continue; }
            if (resource.kind    === 'MongoDB' ) { continue; }

            const sqlRoleDefinitionsResponse = cosmosDBManagementClient.sqlResources.listSqlRoleDefinitions(resourceGroupName, accountName);
            
            const sqlRoleDefinitions = new Array<SqlRoleDefinitionGetResults>;

            for await (const sqlRoleDefinition of sqlRoleDefinitionsResponse) {
                sqlRoleDefinitions.push(sqlRoleDefinition);
            }

            const sqlRoleAssignments = cosmosDBManagementClient.sqlResources.listSqlRoleAssignments(resourceGroupName, accountName);

            for await (const sqlRoleAssignment of sqlRoleAssignments) {
                const roleDefinitionId = sqlRoleAssignment.roleDefinitionId;
                const scope            = sqlRoleAssignment.scope           ;
                const principalId      = sqlRoleAssignment.principalId     ;

                const sqlRoleDefinitionGetResult = sqlRoleDefinitions.find(p => p.id === roleDefinitionId);

                if (roleDefinitionId           === undefined) { continue; }
                if (scope                      === undefined) { continue; }
                if (principalId                === undefined) { continue; }
                if (sqlRoleDefinitionGetResult === undefined) { continue; }

                sqlRoleDefinitionAssignments.push({
                    resourceGroupName        ,
                    accountName              ,
                    roleDefinitionId         ,
                    scope                    , 
                    principalId              ,
                    sqlRoleDefinitionGetResult
                })
            }
        }

        return sqlRoleDefinitionAssignments;
    }
}

interface SqlRoleDefinitionAssignment
{
    resourceGroupName          : string
    accountName                : string
    roleDefinitionId           : string
    scope                      : string
    principalId                : string
    sqlRoleDefinitionGetResult : SqlRoleDefinitionGetResults
}