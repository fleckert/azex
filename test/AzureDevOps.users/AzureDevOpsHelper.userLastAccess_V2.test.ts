import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPortalLinks    } from "../../src/AzureDevOpsPortalLinks";
import { Helper                    } from "../../src/Helper";
import { Html                      } from "../../src/Converters/Html";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper                } from "../_TestHelper/TestHelper";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsHelper_userLastAccess_V2', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;

    const file = await TestHelper.prepareFile([__dirname, 'out', organization, `${organization}-userLastAccess_V2.html`]);

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    const userEntitlements = await azureDevOpsHelper.memberEntitlements(organization, maxNumberOfTests);

    userEntitlements.sort((a, b) => `${a.member.displayName}`.toLowerCase().localeCompare(`${b.member.displayName}`.toLowerCase()));

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
            p.member.displayName ?? '',
            Html.getLinkWithToolTip(`${p.member.principalName}`, AzureDevOpsPortalLinks.Permissions(organization,undefined, p.member.descriptor!), 'open permissions'),
            Html.getLinkWithToolTip((`${p.dateCreated     }` === '0001-01-01T00:00:00Z' ? ''      : timeStampDisplay(`${p.dateCreated     }`)) ?? '', AzureDevOpsHelper.userEntitlementsUrl(organization, p.member.descriptor!), 'show details'),
            Html.getLinkWithToolTip((`${p.lastAccessedDate}` === '0001-01-01T00:00:00Z' ? 'never' : timeStampDisplay(`${p.lastAccessedDate}`)) ?? '', AzureDevOpsHelper.userEntitlementsUrl(organization, p.member.descriptor!), 'show details')
        ]),
        dataPageSize
    );

    await writeFile(file, html);

    console.log({ file });
}, 100000);

