import   path                        from "path";
import { devops_identity_list      } from "../../../../src/CommandHandler/devops_identity_list";
import { TestConfigurationProvider } from "../../../_Configuration/TestConfiguration";

test('devops_identity_list', async () => {
    const pathOut      = path.join(__dirname, 'out', 'devops_identity_list');
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenantId     = config.azureDevOps.tenantId;

    await devops_identity_list.resolve(tenantId, organization, pathOut);
}, 100000);
