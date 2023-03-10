import { AzureDevOpsHelper         } from "../../../../../src/AzureDevOpsHelper";
import { devops_identity_show      } from "../../../../../src/CommandHandler/devops_identity_show";
import { TestConfigurationProvider } from "../../../../_Configuration/TestConfiguration";

test('devops_identity_show-user', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenantId         = config.azureDevOps.tenantId;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const collection = await azureDevOpsHelper.graphUsersList(config.azureDevOps.organization, maxNumberOfTests);

    for (const item of collection.filter(p => p.principalName !== undefined)) {
        await devops_identity_show.resolve(tenantId, organization, item.principalName!, ['User']);
    }
}, 100000);

test('devops_identity_show-group', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenantId         = config.azureDevOps.tenantId;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const collection = await azureDevOpsHelper.graphGroupsList(organization, maxNumberOfTests);

    for (const item of collection.filter(p => p.principalName !== undefined)) {
        await devops_identity_show.resolve(tenantId, organization, item.principalName!, ['Group']);
    }
}, 100000);