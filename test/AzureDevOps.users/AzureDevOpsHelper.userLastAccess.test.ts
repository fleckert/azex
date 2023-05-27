import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPortalLinks    } from "../../src/AzureDevOpsPortalLinks";
import { Helper                    } from "../../src/Helper";
import { Html                      } from "../../src/Converters/Html";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper                } from "../_TestHelper/TestHelper";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsHelper_userLastAccess', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;

    const file = await TestHelper.prepareFile([__dirname, 'out', organization, `${organization}-userLastAccess.html`]);

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    const users = await azureDevOpsHelper.graphUsersList(organization, maxNumberOfTests);

    const userEntitlements = await Helper.batchCalls(
        users.filter(p => p.descriptor !== undefined)
             .filter(p => p.descriptor!.startsWith('svc.') === false),
        user => azureDevOpsHelper.userEntitlements(organization, user.descriptor!)
    );

    userEntitlements.sort((a, b) => `${a.parameters.displayName}`.toLowerCase().localeCompare(`${b.parameters.displayName}`.toLowerCase()));

    const timeStampDisplay = (value: string) => {
        const valueStripped = value.substring(0, value.indexOf('.') > 0 ? value.indexOf('.') : undefined) + 'Z';
    
        return valueStripped;
    }

    const dataPageSize = 1000;

    const html = Html.tableWithSorting(
        `${organization} - users - ${new Date().toISOString()}`,
        ['displayName', 'principalName', 'dateCreated', 'lastAccessedDate'],
        userEntitlements
            .map(p => [
            p.parameters.displayName ?? '',
            Html.getLinkWithToolTip(`${p.parameters.principalName}`, AzureDevOpsPortalLinks.Permissions(organization,undefined, p.parameters.descriptor!), 'open permissions'),
            Html.getLinkWithToolTip((`${p.result.dateCreated     }` === '0001-01-01T00:00:00Z' ? ''      : timeStampDisplay(`${p.result.dateCreated     }`)) ?? '', AzureDevOpsHelper.userEntitlementsUrl(organization, p.parameters.descriptor!), 'show details'),
            Html.getLinkWithToolTip((`${p.result.lastAccessedDate}` === '0001-01-01T00:00:00Z' ? 'never' : timeStampDisplay(`${p.result.lastAccessedDate}`)) ?? '', AzureDevOpsHelper.userEntitlementsUrl(organization, p.parameters.descriptor!), 'show details')
        ]),
        dataPageSize
    );

    await writeFile(file, html);

    console.log({ file });
}, 100000);

