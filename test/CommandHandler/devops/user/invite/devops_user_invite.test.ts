import { TestConfigurationProvider } from "../../../../_Configuration/TestConfiguration";
import { devops_invite_user        } from "../../../../../src/CommandHandler/devops_invite_user";

test('devops_user_invite', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenant       = config.azureDevOps.tenant;

    const principalName = '';

    if (`${principalName}` !== '') {
        await devops_invite_user.handle(tenant, organization, principalName, 'express');
    }
}, 100000);
