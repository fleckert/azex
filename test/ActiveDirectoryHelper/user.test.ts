import { ActiveDirectoryUser       } from "../models/ActiveDirectoryUser";
import { TestActiveDirectoryHelper } from "../TestActiveDirectoryHelper";
import { TestConfigurationProvider } from "../TestConfigurationProvider";
import { TestHelper                } from "../TestHelper";

test('ActiveDirectoryHelper-users', async () => {
    const checkFailedRequests = (collection: Array<string>, collectionName: string) : void=> {
        if (collection.length > 0) {
            throw new Error(`${collectionName} : ${JSON.stringify(collection, null, 2)}`);
        }
    }

    const compareUsers = (a: ActiveDirectoryUser, b: ActiveDirectoryUser): boolean => {
        return a.id               .toLowerCase() === b.id               .toLowerCase()
            && a.userPrincipalName.toLowerCase() === b.userPrincipalName.toLowerCase()
            && a.displayName      .toLowerCase() === b.displayName      .toLowerCase();
    }

    const config = await TestConfigurationProvider.get();

    const userPrincipalNames = config.userNames.map(p => `${p}@${config.domain}`);

    const usersByUserPrincipalName            = await TestActiveDirectoryHelper.get().getUsersByUserPrincipalName(userPrincipalNames                          );
    const usersByUserPrincipalNameToUpperCase = await TestActiveDirectoryHelper.get().getUsersByUserPrincipalName(userPrincipalNames.map(p => p.toUpperCase()));
    const usersByUserPrincipalNameToLowerCase = await TestActiveDirectoryHelper.get().getUsersByUserPrincipalName(userPrincipalNames.map(p => p.toLowerCase()));
    const usersById                           = await TestActiveDirectoryHelper.get().getUsersById(usersByUserPrincipalName.items.map(p => p.id));

    checkFailedRequests(usersByUserPrincipalName           .failedRequests, "usersByUserPrincipalName.failedRequests"           );
    checkFailedRequests(usersByUserPrincipalNameToUpperCase.failedRequests, "usersByUserPrincipalNameToUpperCase.failedRequests");
    checkFailedRequests(usersByUserPrincipalNameToLowerCase.failedRequests, "usersByUserPrincipalNameToLowerCase.failedRequests"); 
    checkFailedRequests(usersById.failedRequests                          , "usersById.failedRequests"                          ); 

    const userPrincipalNamesByIds = usersById.items.map(p => p.userPrincipalName);

    if (!TestHelper.checkForCorrespondingElements(userPrincipalNames, userPrincipalNamesByIds, (a: string, b: string) => a.toLowerCase() === b.toLowerCase())) {
        throw new Error(`userPrincipalNames and userPrincipalNamesByIds do not match. ${JSON.stringify({ userPrincipalNames, userPrincipalNamesByIds }, null, 2)}`);
    }

    if (!TestHelper.checkForCorrespondingElements(usersByUserPrincipalName.items, usersByUserPrincipalNameToUpperCase.items, compareUsers)) {
        throw new Error(`usersByUserPrincipalName.items and usersByUserPrincipalNameToUpperCase.items do not match. ${JSON.stringify({ usersByUserPrincipalName: usersByUserPrincipalName.items, usersByUserPrincipalNameToUpperCase: usersByUserPrincipalNameToUpperCase.items }, null, 2)}`);
    }

    if (!TestHelper.checkForCorrespondingElements(usersByUserPrincipalName.items, usersByUserPrincipalNameToLowerCase.items, compareUsers)) {
        throw new Error(`usersByUserPrincipalName.items and usersByUserPrincipalNameToLowerCase.items do not match. ${JSON.stringify({ usersByUserPrincipalName: usersByUserPrincipalName.items, usersByUserPrincipalNameToLowerCase: usersByUserPrincipalNameToLowerCase.items }, null, 2)}`);
    }

}, 100000);


