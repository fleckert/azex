import { devops_permissions_token  } from "../../../../src/CommandHandler/devops_permissions_token";
import { TestConfigurationProvider } from "../../../_Configuration/TestConfiguration";

test('devops_permissions_token', async () => {
    const config = await TestConfigurationProvider.get();

    await devops_permissions_token.iteration(config.azureDevOps.organization, config.azureDevOps.projectName, `${config.azureDevOps.projectName} Team`, undefined);

}, 100000);
