import { devops_memberships_clear  } from "../../../../../src/CommandHandler/devops_memberships_clear";
import { TestConfigurationProvider } from "../../../../_Configuration/TestConfiguration";

test('devops_memberships_clear', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenant       = config.azureDevOps.tenant;

    const principalName = '';

    if (`${principalName}` !== '') {
        await devops_memberships_clear.handle(tenant, organization, principalName);
    }
}, 100000);
