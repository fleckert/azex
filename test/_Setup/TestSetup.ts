import { ActiveDirectoryApplication      } from "../../src/models/ActiveDirectoryApplication";
import { ActiveDirectoryGroup            } from "../../src/models/ActiveDirectoryGroup";
import { ActiveDirectoryHelper           } from "../../src/ActiveDirectoryHelper";
import { ActiveDirectoryServicePrincipal } from "../../src/models/ActiveDirectoryServicePrincipal";
import { ActiveDirectoryUser             } from "../../src/models/ActiveDirectoryUser";
import { AzureRoleAssignmentsExtender    } from "../../src/AzureRoleAssignmentsExtender";
import { Guid                            } from "../../src/Guid";
import { PrincipalType, RoleAssignment   } from "@azure/arm-authorization/esm/models";
import { RbacDefinition                  } from "../../src/models/RbacDefinition";
import { ResourceManagementClient        } from "@azure/arm-resources";
import { RoleAssignmentHelper            } from "../../src/RoleAssignmentHelper";
import { TokenCredential                 } from "@azure/identity";

export class TestSetup {
    static async ensureTestUsersExist(activeDirectoryHelper: ActiveDirectoryHelper, names: Array<string>, domain: string)
        : Promise<{
            existingItems: Array<ActiveDirectoryUser>,
            newItems: Array<ActiveDirectoryUser>,
            errors: Array<Error>
        }> {
        const getCreateUserObject = (name: string, domain: string) => {
            return {
                accountEnabled: false,
                displayName: name,
                mailNickname: name,
                userPrincipalName: `${name}@${domain}`,
                passwordProfile: {
                    forceChangePasswordNextSignIn: true,
                    password: `${Guid.newGuid()}-${Guid.newGuid().toUpperCase()}`
                }
            };
        }

        const testUsers = names.map(name => getCreateUserObject(name, domain));
        const existingItems = await activeDirectoryHelper.getUsersByUserPrincipalName(testUsers.map(user => user.userPrincipalName));

        const errors = new Array<Error>();
        const newItems = new Array<ActiveDirectoryUser>();

        for (const user of testUsers) {
            if (existingItems.items.find(p => p.userPrincipalName.toLowerCase() === user.userPrincipalName.toLowerCase()) !== undefined) {
                // user exists and this code only checks that the user exists
                // any properties besides the userPrincipalName are irrelevant
                continue;
            }

            const response = await activeDirectoryHelper.createUser(
                user.accountEnabled,
                user.displayName,
                user.mailNickname,
                user.userPrincipalName,
                user.passwordProfile
            );

            if (response.error !== undefined) { errors.push(response.error); }
            if (response.item !== undefined) { newItems.push(response.item); } else { errors.push(new Error(`Failed to create user '${user.userPrincipalName}'.`)); }
        }

        // existingUsers.failedRequests is ignored as it is expected that non-existent users are listed here
        return { existingItems: existingItems.items, newItems: newItems, errors };
    }

    static async ensureTestGroupsExist(activeDirectoryHelper: ActiveDirectoryHelper, displayNames: Array<string>):
        Promise<{
            existingItems: Array<ActiveDirectoryGroup>,
            newItems: Array<ActiveDirectoryGroup>,
            errors: Array<Error>
        }> {

        const existingItems = await activeDirectoryHelper.getGroupsByDisplayName(displayNames);

        if (existingItems.failedRequests.length > 0) {
            return { existingItems: [], newItems:[], errors: existingItems.failedRequests.map(p => new Error(p)) };
        }

        const errors = new Array<Error>();
        const newItems = new Array<ActiveDirectoryGroup>();

        for (const displayName of displayNames) {
            if (existingItems.items.find(p => p.displayName.toLowerCase() === displayName.toLowerCase()) !== undefined) {
                // group exists and this code only checks that the group exists
                // any properties besides the displayName are irrelevant
                continue;
            }

            const response = await activeDirectoryHelper.createGroup(displayName, false, displayName);

            if (response.error !== undefined) { errors.push(response.error); }
            if (response.item !== undefined) { newItems.push(response.item); } else { errors.push(new Error(`Failed to create group '${displayName}'.`)); }
        }

        // existingGroups.failedRequests is ignored as it is expected that non-existent users are listed here
        return { existingItems: existingItems.items, newItems: newItems, errors };
    }

    static async ensureTestApplicationsExist(activeDirectoryHelper: ActiveDirectoryHelper, displayNames: Array<string>):
        Promise<{
            existingItems: Array<ActiveDirectoryApplication>,
            newItems: Array<ActiveDirectoryApplication>,
            errors: Array<Error>
        }> {

        const existingItems = await activeDirectoryHelper.getApplicationsByDisplayName(displayNames);

        if (existingItems.failedRequests.length > 0) {
            return { existingItems: [], newItems:[], errors: existingItems.failedRequests.map(p => new Error(p)) };
        }

        const errors = new Array<Error>();
        const newItems = new Array<ActiveDirectoryApplication>();

        for (const displayName of displayNames) {
            if (existingItems.items.find(p => p.displayName.toLowerCase() === displayName.toLowerCase()) !== undefined) {
                // application exists and this code only checks that the application exists
                // any properties besides the displayName are irrelevant
                continue;
            }

            const response = await activeDirectoryHelper.createApplication(displayName);

            if (response.error !== undefined) { errors.push(response.error); }
            if (response.item !== undefined) { newItems.push(response.item); } else { errors.push(new Error(`Failed to create application '${displayName}'.`)); }
        }

        // existingServicePrincipals.failedRequests is ignored as it is expected that non-existent servicePrincipals are listed here
        return { existingItems: existingItems.items, newItems, errors };
    }

    static async ensureTestServicePrincipalsExist(activeDirectoryHelper: ActiveDirectoryHelper, displayNames: Array<string>):
        Promise<{
            existingItems: Array<ActiveDirectoryServicePrincipal>,
            newItems: Array<ActiveDirectoryServicePrincipal>,
            errors: Array<Error>
        }> {

        const existingApps = await activeDirectoryHelper.getApplicationsByDisplayName(displayNames);

        if (existingApps.failedRequests.length > 0) {
            return { existingItems: [], newItems: [], errors: existingApps.failedRequests.map(p => new Error(p)) };
        }

        const appIds = existingApps.items.map(p => p.appId);

        const existingItems = await activeDirectoryHelper.getServicePrincipalsByAppIds(appIds);

        const errors = new Array<Error>();
        const newItems = new Array<ActiveDirectoryServicePrincipal>();

        errors.push(...existingItems.failedRequests.map(p => { return new Error(p) }));

        for (const displayName of displayNames) {
            const application = existingApps.items.find(p => p.displayName.toLowerCase() === displayName.toLowerCase());
            if (application === undefined) { continue; }

            const servicePrincipal = existingItems.items.find(p => p.displayName.toLowerCase() === displayName.toLowerCase());
            if (servicePrincipal !== undefined) { continue; }

            const response = await activeDirectoryHelper.createServicePrincipal(application.appId);

            if (response.error !== undefined) { errors.push(response.error); }
            if (response.item !== undefined) { newItems.push(response.item); } else { errors.push(new Error(`Failed to create servicerPrincipal '${displayName}'.`)); }
        }

        // existingServicePrincipals.failedRequests is ignored as it is expected that non-existent servicePrincipals are listed here
        return { existingItems: existingItems.items, newItems: newItems, errors };
    }

    static async ensureResourceGroupsExist(credentials: TokenCredential, subscriptionId: string, resourceGroupNames: Array<string>, location: string):
        Promise<{
            existingItems: Array<string>,
            newItems     : Array<string>,
            errors       : Array<Error >
        }> {

        const newItems      = new Array<string>();
        const existingItems = new Array<string>();
        const errors        = new Array<Error >();

        const resourceManagementClient = new ResourceManagementClient(credentials, subscriptionId);

        for (const resourceGroupName of resourceGroupNames) {

            const response = await resourceManagementClient.resourceGroups.checkExistence(resourceGroupName)

            if (response.body === true) {
                existingItems.push(resourceGroupName);
            }
            else {
                try {
                    await resourceManagementClient.resourceGroups.createOrUpdate(resourceGroupName, { location });
                    newItems.push(resourceGroupName);
                }
                catch (e: any) {
                    errors.push(e);
                }
            }
        }

        return { existingItems, newItems, errors };
    }

    static async ensureResourceGroupsRbacsExist(credentials: TokenCredential, subscriptionId: string, domain: string, rbacAssignments: Array<{ resourceGroupName: string, principalType: string, roleDefinitionName: string, name: string }>):
        Promise<{
            items: Array<RoleAssignment>,
            errors: Array<Error>
        }> {

        const items  = new Array<RoleAssignment>();
        const errors = new Array<Error         >();


        const rbacDefinitions: RbacDefinition[] = rbacAssignments.map(p => {
            return {
                scope             : `/subscriptions/${subscriptionId}/resourceGroups/${p.resourceGroupName}`,
                principalName     : p.principalType.toLowerCase() === 'user'? `${p.name}@${domain}`: p.name,
                principalType     : p.principalType,
                roleDefinitionName: p.roleDefinitionName,
                roleDefinitionId  : undefined,
                principalId       : undefined
            };
        });

        const { items: rbacDefinitionsExt, failedRequests } = await new AzureRoleAssignmentsExtender().extend(credentials, subscriptionId, rbacDefinitions);

        if (failedRequests.length > 0) { errors.push(...failedRequests.map(p => new Error(p))); }

        const roleAssignmentHelper = new RoleAssignmentHelper(credentials, subscriptionId);

        for (const item of rbacDefinitionsExt) {
            if (item.principalId === undefined) {
                errors.push(new Error(`principalId === undefined in ${JSON.stringify(item)}`));
            }
            else if (item.roleDefinitionId === undefined) {
                errors.push(new Error(`roleDefinitionId === undefined in ${JSON.stringify(item)}`));
            }
            else if (item.principalType as PrincipalType === undefined) {
                errors.push(new Error(`item.principalType as PrincipalType === undefined in ${JSON.stringify(item)}`));
            }
            else {
                try {
                    const response = await roleAssignmentHelper.setRoleAssignment(item.scope, item.principalId, item.roleDefinitionId, item.principalType as PrincipalType);

                    items.push(response);
                }
                catch (e: any) {
                    errors.push(e);
                }
            }
        }

        return { items, errors };
    }
}