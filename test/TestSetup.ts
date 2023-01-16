import { ActiveDirectoryApplication      } from "../src/models/ActiveDirectoryApplication";
import { ActiveDirectoryGroup            } from "../src/models/ActiveDirectoryGroup";
import { ActiveDirectoryHelper           } from "../src/ActiveDirectoryHelper";
import { ActiveDirectoryServicePrincipal } from "../src/models/ActiveDirectoryServicePrincipal";
import { ActiveDirectoryUser             } from "../src/models/ActiveDirectoryUser";
import { v4 as uuidv4                    } from "uuid";

export class TestSetup {
    static async ensureTestUsersExist(activeDirectoryHelper: ActiveDirectoryHelper, names: Array<string>, domain: string):
        Promise<{
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
                    password: `${uuidv4()}-${uuidv4().toUpperCase()}`
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
        const appIds = existingApps.items.map(p => p.appId);

        const existingItems = await activeDirectoryHelper.getServicePrincipalsByAppIds(appIds);

        const errors = new Array<Error>();
        const newItems = new Array<ActiveDirectoryServicePrincipal>();

        errors.push(...existingApps.failedRequests.map(p => { return new Error(p) }));

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
}