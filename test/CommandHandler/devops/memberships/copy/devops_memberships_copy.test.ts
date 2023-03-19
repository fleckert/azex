import { devops_memberships_copy   } from "../../../../../src/CommandHandler/devops_memberships_copy";
import { TestConfigurationProvider } from "../../../../_Configuration/TestConfiguration";

test('devops_permissions_copy', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenant       = config.azureDevOps.tenant;

    const principalNameSource = '';
    const principalNameTarget = '';

    if (`${principalNameSource}` !== '' && `${principalNameTarget}` !== '') {
        const add    = true;
        const remove = true;
        await devops_memberships_copy.handle(tenant, organization, principalNameSource, principalNameTarget, add, remove);
    }
}, 100000);
