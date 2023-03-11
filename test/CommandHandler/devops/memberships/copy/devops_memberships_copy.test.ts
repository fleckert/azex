import { devops_memberships_copy   } from "../../../../../src/CommandHandler/devops_memberships_copy";
import { TestConfigurationProvider } from "../../../../_Configuration/TestConfiguration";

test('devops_permissions_copy', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenantId     = config.azureDevOps.tenantId;

    const principalNameSource = '';
    const principalNameTarget = '';

    if (`${principalNameSource}` !== '' && `${principalNameTarget}` !== '') {
        await devops_memberships_copy.handle(tenantId, organization, principalNameSource, principalNameTarget);
    }
}, 100000);
