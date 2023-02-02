import { AzureDevOpsPermissionsResolver } from "../../src/AzureDevOpsPermissionsResolver";
import { TestConfigurationProvider      } from "../_Configuration/TestConfiguration";

test('AzureDevOpsPermissionsResolver', async () => {
    const config = await TestConfigurationProvider.get();

    const { error } = await new AzureDevOpsPermissionsResolver().resolve(config.azureDevOps.organization, config.azureDevOps.projectName);

    if (error !== undefined) { throw error; }
}, 100000);
