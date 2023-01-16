import { TestActiveDirectoryHelper } from "./TestActiveDirectoryHelper";
import { TestConfigurationProvider } from "./TestConfigurationProvider";
import { TestHelper } from "./TestHelper";

test('ActiveDirectoryHelper-users', async () => {
    const config = await TestConfigurationProvider.get();

    const userPrincipalNames = config.userNames.map(p => `${p}@${config.domain}`);

    const usersByUserPrincipalName            = await TestActiveDirectoryHelper.get().getUsersByUserPrincipalName(userPrincipalNames                          );
    const usersByUserPrincipalNameToUpperCase = await TestActiveDirectoryHelper.get().getUsersByUserPrincipalName(userPrincipalNames.map(p => p.toUpperCase()));
    const usersByUserPrincipalNameToLowerCase = await TestActiveDirectoryHelper.get().getUsersByUserPrincipalName(userPrincipalNames.map(p => p.toLowerCase()));

    checkFailedRequests(usersByUserPrincipalName           .failedRequests, "usersByUserPrincipalName.failedRequests"           );
    checkFailedRequests(usersByUserPrincipalNameToUpperCase.failedRequests, "usersByUserPrincipalNameToUpperCase.failedRequests");
    checkFailedRequests(usersByUserPrincipalNameToLowerCase.failedRequests, "usersByUserPrincipalNameToLowerCase.failedRequests"); 

    const usersById = await TestActiveDirectoryHelper.get().getUsersById(usersByUserPrincipalName.items.map(p => p.id));
    
    checkFailedRequests(usersById.failedRequests, "usersById.failedRequests"); 

    const userPrincipalNamesByIds = usersById.items.map(p => p.userPrincipalName);

    const namesOkay = TestHelper.checkForCorrespondingElements(userPrincipalNames, userPrincipalNamesByIds, (a: string, b: string) => a.toLowerCase() === b.toLowerCase());

    if (namesOkay === false) {
        throw new Error(`userPrincipalNames and userPrincipalNamesByIds do not match. ${JSON.stringify({ userPrincipalNames, userPrincipalNamesByIds }, null, 2)}`);
    }
}, 100000);

const checkFailedRequests = (collection: Array<string>, collectionName: string) => {
    if (collection.length > 0) {
        throw new Error(`${collectionName} : ${JSON.stringify(collection, null, 2)}`);
    }
}

