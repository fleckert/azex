import { DefaultAzureCredential } from "@azure/identity";
import { ActiveDirectoryHelper } from "../src/ActiveDirectoryHelper";
import { v4 as uuidv4 } from "uuid";
import { ActiveDirectoryUser } from "../src/models/ActiveDirectoryUser";
import { ActiveDirectoryGroup } from "../src/models/ActiveDirectoryGroup";
import { readFile } from "fs/promises";
import path from "path";
import { ActiveDirectoryServicePrincipal } from "../src/models/ActiveDirectoryServicePrincipal";
import { ActiveDirectoryApplication } from "../src/models/ActiveDirectoryApplication";

interface TestConfig {
    domain: string;
    userNames: Array<string>;
    groupNames: Array<string>;
    servicePrincipalNames: Array<string>;
}

test('setup', async () => {
    const credential = new DefaultAzureCredential();
    const activeDirectoryHelper = new ActiveDirectoryHelper(credential);

    const pathToConfigFile = path.join(__dirname, 'testconfig.a.json')
    const configRaw = await readFile(pathToConfigFile);
    const config = JSON.parse(configRaw.toString()) as TestConfig;

    {
        const { existingItems, newItems, errors } = await ensureTestUsersExist(activeDirectoryHelper, config.userNames, config.domain);
        if (errors.length > 0) { throw new Error(errors.map(p => p.message).join('/n')); }
        console.log({ newUsers: newItems.map(p => p.userPrincipalName) });
    }

    {
        const { existingItems, newItems, errors } = await ensureTestGroupsExist(activeDirectoryHelper, config.groupNames)
        if (errors.length > 0) { throw new Error(errors.map(p => p.message).join('/n')); }
        console.log({ newGroups: newItems.map(p => p.displayName) });
    }
    {
        const { existingItems, newItems, errors } = await ensureTestApplicationsExist(activeDirectoryHelper, config.servicePrincipalNames)
        if (errors.length > 0) { throw new Error(errors.map(p => p.message).join('/n')); }
        console.log({ newApplications: newItems.map(p => p.displayName) });
    }
    {
        const { existingItems, newItems, errors } = await ensureTestServicePrincipalsExist(activeDirectoryHelper, config.servicePrincipalNames)
        if (errors.length > 0) { throw new Error(errors.map(p => p.message).join('/n')); }
        console.log({ newServicePrincipals: newItems.map(p => p.displayName) });
    }
}, 100000);

const ensureTestUsersExist = async (activeDirectoryHelper: ActiveDirectoryHelper, names: Array<string>, domain: string):
    Promise<{
        existingItems: Array<ActiveDirectoryUser>, 
        newItems     : Array<ActiveDirectoryUser>, 
        errors       : Array<Error> 
    }> => {
    
    const testUsers = names.map(name => getCreateUserObject(name, domain));
    const existingItems = await activeDirectoryHelper.getUsersByUserPrincipalName(testUsers.map(user => user.userPrincipalName));

    const errors   = new Array<Error              >();
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
        
        if (response.error !== undefined) { errors  .push(response.error); }
        if (response.item  !== undefined) { newItems.push(response.item ); } else { errors.push(new Error(`Failed to create user '${user.userPrincipalName}'.`));}
    }

    // existingUsers.failedRequests is ignored as it is expected that non-existent users are listed here
    return { existingItems: existingItems.items, newItems: newItems, errors };
}

const getCreateUserObject = (name: string, domain: string) => {
    return {
        accountEnabled   : false,
        displayName      : name,
        mailNickname     : name,
        userPrincipalName: `${name}@${domain}`,
        passwordProfile  : {
                               forceChangePasswordNextSignIn: true,
                               password                     : `${uuidv4()}-${uuidv4().toUpperCase()}`
                           }
    };
}

const ensureTestGroupsExist = async (activeDirectoryHelper: ActiveDirectoryHelper, displayNames: Array<string>):
    Promise<{
        existingItems: Array<ActiveDirectoryGroup>, 
        newItems     : Array<ActiveDirectoryGroup>, 
        errors       : Array<Error> 
    }> => {
    
    const existingItems = await activeDirectoryHelper.getGroupsByDisplayName(displayNames);

    const errors   = new Array<Error              >();
    const newItems = new Array<ActiveDirectoryGroup>();
    
    for (const displayName of displayNames) {
        if (existingItems.items.find(p => p.displayName.toLowerCase() === displayName.toLowerCase()) !== undefined) {
            // group exists and this code only checks that the group exists
            // any properties besides the displayName are irrelevant
            continue;
        }

        const response = await activeDirectoryHelper.createGroup(displayName, false, displayName);

        if (response.error !== undefined) { errors   .push(response.error); }
        if (response.item  !== undefined) { newItems.push(response.item ); } else { errors.push(new Error(`Failed to create group '${displayName}'.`));}
    }

    // existingGroups.failedRequests is ignored as it is expected that non-existent users are listed here
    return { existingItems: existingItems.items, newItems: newItems, errors };
}

const ensureTestApplicationsExist = async (activeDirectoryHelper: ActiveDirectoryHelper, displayNames: Array<string>):
    Promise<{
        existingItems: Array<ActiveDirectoryApplication>, 
        newItems     : Array<ActiveDirectoryApplication>, 
        errors       : Array<Error> 
    }> => {
    
    const existingItems = await activeDirectoryHelper.getApplicationsByDisplayName(displayNames);

    const errors   = new Array<Error                     >();
    const newItems = new Array<ActiveDirectoryApplication>();
    
    for (const displayName of displayNames) {
        if (existingItems.items.find(p => p.displayName.toLowerCase() === displayName.toLowerCase()) !== undefined) {
            // application exists and this code only checks that the application exists
            // any properties besides the displayName are irrelevant
            continue;
        }

        const response = await activeDirectoryHelper.createApplication(displayName);

        if (response.error       !== undefined) { errors   .push(response.error); }
        if (response.item !== undefined) { newItems.push(response.item ); } else { errors.push(new Error(`Failed to create application '${displayName}'.`));}
    }

    // existingServicePrincipals.failedRequests is ignored as it is expected that non-existent servicePrincipals are listed here
    return { existingItems: existingItems.items, newItems, errors };
}

const ensureTestServicePrincipalsExist = async (activeDirectoryHelper: ActiveDirectoryHelper, displayNames: Array<string>):
    Promise<{
        existingItems: Array<ActiveDirectoryServicePrincipal>, 
        newItems     : Array<ActiveDirectoryServicePrincipal>, 
        errors       : Array<Error> 
    }> => {

    const existingApps = await activeDirectoryHelper.getApplicationsByDisplayName(displayNames);
    const appIds = existingApps.items.map(p => p.appId);

    const existingItems = await activeDirectoryHelper.getServicePrincipalsByAppIds(appIds);

    const errors   = new Array<Error                          >();
    const newItems = new Array<ActiveDirectoryServicePrincipal>();

    errors.push(...existingApps.failedRequests.map(p => { return new Error(p) }));
    
    for (const displayName of displayNames) {
        const application = existingApps.items.find(p => p.displayName.toLowerCase() === displayName.toLowerCase());
        if (application === undefined) { continue; }

        const servicePrincipal = existingItems.items.find(p => p.displayName.toLowerCase() === displayName.toLowerCase());
        if (servicePrincipal !== undefined) { continue; }

        const response = await activeDirectoryHelper.createServicePrincipal(application.appId);

        if (response.error !== undefined) { errors  .push(response.error); }
        if (response.item  !== undefined) { newItems.push(response.item ); } else { errors.push(new Error(`Failed to create servicerPrincipal '${displayName}'.`));}
    }

    // existingServicePrincipals.failedRequests is ignored as it is expected that non-existent servicePrincipals are listed here
    return { existingItems: existingItems.items, newItems: newItems, errors };
}