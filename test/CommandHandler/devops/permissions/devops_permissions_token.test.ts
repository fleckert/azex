import path from "path";
import { devops_permissions_token  } from "../../../../src/CommandHandler/devops_permissions_token";
import { TestConfigurationProvider } from "../../../_Configuration/TestConfiguration";

test('devops_permissions_token-classificationNodes', async () => {
    const config  = await TestConfigurationProvider.get();
    const pathOut = path.join(__dirname, 'out', `azex-test-devops_permissions_token-classificationNodes`);

    await devops_permissions_token.classificationNodes(config.azureDevOps.organization, config.azureDevOps.projectName, pathOut);
}, 100000);

test('devops_permissions_token-gitRepositories', async () => {
    const config  = await TestConfigurationProvider.get();
    const pathOut = path.join(__dirname, 'out', `azex-test-devops_permissions_token-gitRepositories`);

    await devops_permissions_token.gitRepositories(config.azureDevOps.organization, config.azureDevOps.projectName, pathOut);
}, 100000);

test('devops_permissions_token-all', async () => {
    const config  = await TestConfigurationProvider.get();
    const pathOut = path.join(__dirname, 'out', `azex-test-devops_permissions_token-all`);

    await devops_permissions_token.all(config.azureDevOps.organization, config.azureDevOps.projectName, pathOut);
}, 100000);

