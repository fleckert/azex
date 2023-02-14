import { AzureDevOpsHelper         } from "../../../../src/AzureDevOpsHelper";
import { devops_identity_show      } from "../../../../src/CommandHandler/devops_identity_show";
import { TestConfigurationProvider } from "../../../_Configuration/TestConfiguration";

test('devops_identity_show-user', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();

    const users = await azureDevOpsHelper.graphUsersList(config.azureDevOps.organization);
    if (users.error !== undefined) { throw users.error; }
    if (users.value === undefined) { throw new Error("users.value === undefined"); }

    const maxNumerOfTests = 5;

    for (const graphUser of users.value.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphUser.principalName!;

        await devops_identity_show.resolve(config.azureDevOps.organization, principalName, ['User']);
    }
}, 100000);

test('devops_identity_show-group', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();

    const groups = await azureDevOpsHelper.graphGroupsList(config.azureDevOps.organization);
    if (groups.error !== undefined) { throw groups.error; }
    if (groups.value === undefined) { throw new Error("users.value === undefined"); }

    const maxNumerOfTests = 5;

    for (const graphGroup of groups.value.filter(p => p.principalName !== undefined).slice(0, maxNumerOfTests)) {
        const principalName = graphGroup.principalName!;

        await devops_identity_show.resolve(config.azureDevOps.organization, principalName, ['Group']);
    }
}, 100000);