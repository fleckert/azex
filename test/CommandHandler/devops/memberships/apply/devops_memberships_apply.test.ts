import   path                        from "path";
import { devops_memberships_apply  } from "../../../../../src/CommandHandler/devops_memberships_apply";
import { TestConfigurationProvider } from "../../../../_Configuration/TestConfiguration";

test('devops_memberships_apply', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenant       = config.azureDevOps.tenant;

    const pathIn = path.join(__dirname, 'test.json');

    if (`${pathIn}` !== '') {
        await devops_memberships_apply.handle(tenant, organization, pathIn);
    }
}, 100000);
