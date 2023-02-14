import path from "path";
import { devops_permissions_export } from "../../../../src/CommandHandler/devops_permissions_export";
import { TestConfigurationProvider } from "../../../_Configuration/TestConfiguration";

test('devops_permissions_export', async () => {
    const config      = await TestConfigurationProvider.get();
    const pathOut     = path.join(__dirname, 'out', `azex-test-devops-permissions-export`);

    await devops_permissions_export.handle(config.azureDevOps.organization, config.azureDevOps.projectName, pathOut);
}, 100000);
