import path from "path";
import { devops_permissions_export } from "../../../../src/CommandHandler/devops_permissions_export";
import { TestConfigurationProvider } from "../../../_Configuration/TestConfiguration";

test('devops_permissions_export', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const project      = config.azureDevOps.projectName;
    const tenantId     = config.azureDevOps.tenantId;
    const pathOut      = path.join(__dirname, 'out', `azex-test-devops-permissions-export`);

    await devops_permissions_export.handle(tenantId, organization, project, pathOut);
}, 100000);
