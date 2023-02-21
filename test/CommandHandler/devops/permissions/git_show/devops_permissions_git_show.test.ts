import path from "path";
import { devops_permissions_git_show } from "../../../../../src/CommandHandler/devops_permissions_git_show";
import { AzureDevOpsWrapper          } from "../../../../../src/AzureDevOpsWrapper";
import { TestConfigurationProvider   } from "../../../../_Configuration/TestConfiguration";

test('devops_permissions_git_showRepo', async () => {
    const config          = await TestConfigurationProvider.get();
    const pathOut         = path.join(__dirname, 'out', 'devops_permissions_git_showRepo');
    const organization    = config.azureDevOps.organization;
    const projectName     = config.azureDevOps.projectName;
    const baseUrl         = config.azureDevOps.baseUrl;
    const tenantId        = config.azureDevOps.tenantId;
    const maxNumerOfTests = 5;

    const azureDevOpsWrapper = await AzureDevOpsWrapper.instance(baseUrl, tenantId);

    const collection = await azureDevOpsWrapper.gitRepositories(projectName);

    for (const item of collection.filter(p => p.name !== undefined).slice(0, maxNumerOfTests)) {
        await devops_permissions_git_show.handleRepo(tenantId, organization, projectName, item.name!, pathOut);
    }
}, 100000);

test('devops_permissions_git_showProject', async () => {
    const config          = await TestConfigurationProvider.get();
    const pathOut         = path.join(__dirname, 'out', 'devops_permissions_git_showProject');
    const organization    = config.azureDevOps.organization;
    const projectName     = config.azureDevOps.projectName;
    const tenantId        = config.azureDevOps.tenantId;

    await devops_permissions_git_show.handleProject(tenantId, organization, projectName, pathOut);

}, 100000);
