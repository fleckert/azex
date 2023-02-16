import { AzureDevOpsHelper         } from "../../../../src/AzureDevOpsHelper";
import { devops_identity_show      } from "../../../../src/CommandHandler/devops_identity_show";
import { TestConfigurationProvider } from "../../../_Configuration/TestConfiguration";

test('devops_identity_show-user', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenantId     = config.azureDevOps.tenantId;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const users = await azureDevOpsHelper.graphUsersList(config.azureDevOps.organization);

    const maxNumerOfTests = 5;

    for (const graphUser of users.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphUser.principalName!;

        await devops_identity_show.resolve(tenantId, organization, principalName, ['User']);
    }
}, 100000);

test('devops_identity_show-group', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenantId     = config.azureDevOps.tenantId;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const groups = await azureDevOpsHelper.graphGroupsList(config.azureDevOps.organization);

    const maxNumerOfTests = 5;

    for (const graphGroup of groups.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphGroup.principalName!;

        await devops_identity_show.resolve(tenantId, organization, principalName, ['Group']);
    }
}, 100000);