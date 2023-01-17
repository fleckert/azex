import { TestActiveDirectoryHelper } from "./TestActiveDirectoryHelper";
import { TestConfigurationProvider } from "./TestConfigurationProvider";
import { TestSetup                 } from "./TestSetup";


test('setup-test-servicePrincipals', async () => {
    const config = await TestConfigurationProvider.get();

    {
        const { existingItems, newItems, errors } = await TestSetup.ensureTestApplicationsExist(TestActiveDirectoryHelper.get(), config.servicePrincipalNames)
        if (errors.length > 0) { throw new Error(errors.map(p => p.message).join('/n')); }
        console.log({ newApplications: newItems.map(p => p.displayName) });
    }

    {
        const { existingItems, newItems, errors } = await TestSetup.ensureTestServicePrincipalsExist(TestActiveDirectoryHelper.get(), config.servicePrincipalNames)
        if (errors.length > 0) { throw new Error(errors.map(p => p.message).join('/n')); }
        console.log({ newServicePrincipals: newItems.map(p => p.displayName) });
    }
}, 100000);

test('setup-test-users', async () => {
    const config = await TestConfigurationProvider.get();

    const { existingItems, newItems, errors } = await TestSetup.ensureTestUsersExist(TestActiveDirectoryHelper.get(), config.userNames, config.domain);
    if (errors.length > 0) { throw new Error(errors.map(p => p.message).join('/n')); }
    console.log({ newUsers: newItems.map(p => p.userPrincipalName) });

}, 100000);

test('setup-test-groups', async () => {
    const config = await TestConfigurationProvider.get();

    const { existingItems, newItems, errors } = await TestSetup.ensureTestGroupsExist(TestActiveDirectoryHelper.get(), config.groupNames)
    if (errors.length > 0) { throw new Error(errors.map(p => p.message).join('/n')); }
    console.log({ newGroups: newItems.map(p => p.displayName) });
}, 100000);