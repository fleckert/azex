import { AzureDevOpsHelper         } from "../../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - graphSubjectQuery', async () => {
    const config        = await TestConfigurationProvider.get();
    const organization  = config.azureDevOps.organization;
    const tenant        = config.azureDevOps.tenant;
    const principalName = config.azureDevOps.principalName;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    const memberByPrincipalName = await azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, ['User'], principalName);

    if (memberByPrincipalName === undefined) {
        throw new Error(JSON.stringify({ tenant, organization, memberByPrincipalName, principalName, message: `Failed to resolve by graphSubjectQueryByPrincipalName.` }));
    }

    const memberByDisplayName = await azureDevOpsHelper.graphSubjectQueryByDisplayName(organization, ['User'], `${memberByPrincipalName.displayName}`);

    if (memberByDisplayName === undefined) {
        throw new Error(JSON.stringify({ tenant, organization, memberByPrincipalName, principalName, message: `Failed to resolve by graphSubjectQueryByDisplayName.` }));
    }
}, 100000);