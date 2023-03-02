import { devops_permissions_copy   } from "../../../../../src/CommandHandler/devops_permissions_copy";
import { TestConfigurationProvider } from "../../../../_Configuration/TestConfiguration";

test('devops_permissions_copy', async () => {
    const config              = await TestConfigurationProvider.get();
    const organization        = config.azureDevOps.organization;
    const tenantId            = config.azureDevOps.tenantId;
    const principalNameSource = 'jonharro@microsoft.com';
    const principalNameTarget = 'flo.eckert@live.com';

    if(`${principalNameSource}` !== '' && `${principalNameTarget}` !== ''){
        await devops_permissions_copy.handle(tenantId, organization, principalNameSource, principalNameTarget);
    }
}, 100000);
