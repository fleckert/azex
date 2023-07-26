import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPortalLinks    } from "../../src/AzureDevOpsPortalLinks";
import { Html                      } from "../../src/Converters/Html";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper                } from "../_TestHelper/TestHelper";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsHelper_users', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;

    const file = await TestHelper.prepareFile([__dirname, 'out', organization, `${organization}-users.html`]);

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    const users = await azureDevOpsHelper.graphUsersList(organization, maxNumberOfTests);
    users.sort((a, b) => `${a.displayName}`.toLowerCase().localeCompare(`${b.displayName}`.toLowerCase()));

    const dataPageSize = 1000;

    const html = Html.tableWithSorting(
        `${organization} - users - ${new Date().toISOString()}`,
        ['users'],
        users.filter(p => p.descriptor !== undefined)
            .filter(p => p.descriptor!.startsWith('svc.') === false)
            .map(p => [
                (p.displayName ?? '') + ' | '+ Html.getLinkWithToolTip(`${p.principalName}`, AzureDevOpsPortalLinks.Permissions(organization, undefined, p.descriptor!), 'open permissions'),
            ]),
        dataPageSize
    );

    await writeFile(file, html);

    console.log({ file });
}, 100000);

