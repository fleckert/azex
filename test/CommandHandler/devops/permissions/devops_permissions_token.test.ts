import path from "path";
import { devops_permissions_token  } from "../../../../src/CommandHandler/devops_permissions_token";
import { TestConfigurationProvider } from "../../../_Configuration/TestConfiguration";

test('devops_permissions_token-classificationNodes', async () => {
    const config  = await TestConfigurationProvider.get();
    const pathOut = path.join(__dirname, 'out', `azex-test-devops_permissions_token-classificationNodes`);

    await devops_permissions_token.classificationNodes(config.azureDevOps.organization, config.azureDevOps.projectName, pathOut);
}, 100000);

