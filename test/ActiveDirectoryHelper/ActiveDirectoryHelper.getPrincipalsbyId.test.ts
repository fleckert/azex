import { ActiveDirectoryEntity     } from "../../src/models/ActiveDirectoryEntity";
import { Guid                      } from "../../src/Guid";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper                } from "../_TestHelper/TestHelper";

test('ActiveDirectoryHelper-getPrincipalsbyId', async () => {
    const checkFailedRequests = (collection: Array<string>, collectionName: string) : void=> {
        if (collection.length > 0) {
            throw new Error(`${collectionName} : ${JSON.stringify(collection, null, 2)}`);
        }
    }

    const isEqualActiveDirectoryEntityIdCaseInsensitive = (a: ActiveDirectoryEntity, b: ActiveDirectoryEntity) => a.id.toLowerCase() === b.id.toLowerCase();

    const config = await TestConfigurationProvider.get();

    const usersByUserPrincipalName       = await TestConfigurationProvider.getActiveDirectoryHelper().getUsersByUserPrincipalName      (config.userNames.map(p => `${p}@${config.domain}`));
    const groupsByDisplayName            = await TestConfigurationProvider.getActiveDirectoryHelper().getGroupsByDisplayName           (config.groupNames                                 );
    const servicePrincipalsByDisplayName = await TestConfigurationProvider.getActiveDirectoryHelper().getServicePrincipalsByDisplayName(config.servicePrincipalNames                      );
    const applicationsByDisplayName      = await TestConfigurationProvider.getActiveDirectoryHelper().getApplicationsByDisplayName     (config.servicePrincipalNames                      );

    checkFailedRequests(usersByUserPrincipalName      .failedRequests, "usersByUserPrincipalName.failedRequests"      );
    checkFailedRequests(groupsByDisplayName           .failedRequests, "groupsByDisplayName.failedRequests"           );
    checkFailedRequests(servicePrincipalsByDisplayName.failedRequests, "servicePrincipalsByDisplayName.failedRequests");
    checkFailedRequests(applicationsByDisplayName     .failedRequests, "applicationsByDisplayName.failedRequests"     );

    const allIds = [
        ...usersByUserPrincipalName      .items.map(p=>p.id),
        ...groupsByDisplayName           .items.map(p=>p.id),
        ...servicePrincipalsByDisplayName.items.map(p=>p.id),
        ...applicationsByDisplayName     .items.map(p=>p.id)
    ];

    const allEntities = await TestConfigurationProvider.getActiveDirectoryHelper().getPrincipalsbyId(allIds);
    checkFailedRequests(allEntities.failedRequests, "allEntities.failedRequests");

    const missingUsers             = TestHelper.getMissingElements(allEntities.items, usersByUserPrincipalName      .items, isEqualActiveDirectoryEntityIdCaseInsensitive).itemsInBandNotInA;
    const missingGroups            = TestHelper.getMissingElements(allEntities.items, groupsByDisplayName           .items, isEqualActiveDirectoryEntityIdCaseInsensitive).itemsInBandNotInA;
    const missingServicePrincipals = TestHelper.getMissingElements(allEntities.items, servicePrincipalsByDisplayName.items, isEqualActiveDirectoryEntityIdCaseInsensitive).itemsInBandNotInA;
    const missingApplications      = TestHelper.getMissingElements(allEntities.items, applicationsByDisplayName     .items, isEqualActiveDirectoryEntityIdCaseInsensitive).itemsInBandNotInA;
    

    if (missingUsers             .length > 0) { throw new Error(`Failed to resolve users. ${            JSON.stringify({ missingUsers              }, null, 2)}`); }
    if (missingGroups            .length > 0) { throw new Error(`Failed to resolve groups. ${           JSON.stringify({ missingGroups             }, null, 2)}`); }
    if (missingServicePrincipals .length > 0) { throw new Error(`Failed to resolve servicePrincipals. ${JSON.stringify({ missingServicePrincipals  }, null, 2)}`); }
    if (missingApplications      .length > 0) { throw new Error(`Failed to resolve applications. ${     JSON.stringify({ missingApplications       }, null, 2)}`); }
}, 100000);

test('ActiveDirectoryHelper-getPrincipalsbyId-invalid-ids', async () => {

    const id = 'invalid-id';

    const principalsById = await TestConfigurationProvider.getActiveDirectoryHelper().getPrincipalsbyId([id]);

    if (principalsById.failedRequests.length === 0) {
        throw new Error(`principalsById.failedRequests.length === 0 for '${JSON.stringify({ id }, null, 2)}'.`);
    }

    if (principalsById.items.length !== 0) {
        throw new Error(`principalsById.items.length !== 0 for '${JSON.stringify({ id }, null, 2)}'.`);
    }
}, 100000);


test('ActiveDirectoryHelper-getPrincipalsbyId-new-guid', async () => {

    const id = Guid.newGuid();

    const principalsById = await TestConfigurationProvider.getActiveDirectoryHelper().getPrincipalsbyId([id]);

    if (principalsById.failedRequests.length === 0) {
        throw new Error(`principalsById.failedRequests.length === 0 for '${JSON.stringify({ id }, null, 2)}'.`);
    }

    if (principalsById.items.length !== 0) {
        throw new Error(`principalsById.items.length !== 0 for '${JSON.stringify({ id }, null, 2)}'.`);
    }
}, 100000);
