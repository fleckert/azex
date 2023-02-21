import path from "path";
import { devops_permissions_export } from "../../../../../src/CommandHandler/devops_permissions_export";
import { TestConfigurationProvider } from "../../../../_Configuration/TestConfiguration";

test('devops_permissions_export', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const projectName  = config.azureDevOps.projectName;
    const tenantId     = config.azureDevOps.tenantId;
    const pathOut      = path.join(__dirname, 'out', `devops-permissions-export`);

    await devops_permissions_export.handle(tenantId, organization, projectName, pathOut);
}, 100000);