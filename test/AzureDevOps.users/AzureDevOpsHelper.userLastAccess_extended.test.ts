import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPortalLinks    } from "../../src/AzureDevOpsPortalLinks";
import { Helper                    } from "../../src/Helper";
import { Html                      } from "../../src/Converters/Html";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper                } from "../_TestHelper/TestHelper";
import { writeFile                 } from "fs/promises";
import { Markdown } from "../../src/Converters/Markdown";

test('AzureDevOpsHelper_userLastAccess', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;

    const fileHtml = await TestHelper.prepareFile([__dirname, 'out', organization, `${organization}-userLastAccess.html`]);
    const fileMd   = await TestHelper.prepareFile([__dirname, 'out', organization, `${organization}-userLastAccess.md`  ]);

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

    userEntitlements.sort((a, b) => `${a.result.lastAccessedDate}`.toLowerCase().localeCompare(`${b.result.lastAccessedDate}`.toLowerCase()));

    const markdownAll= Markdown.table(
        `${organization} - users - ${new Date().toISOString()} - all`,
        ['displayName', 'principalName', 'dateCreated', 'lastAccessedDate'],
        userEntitlements
            .map(p => [
            p.parameters.displayName ?? '',
            Markdown.getLinkWithToolTip(`${p.parameters.principalName}`, AzureDevOpsPortalLinks.Permissions(organization,undefined, p.parameters.descriptor!), 'open permissions'),
            Markdown.getLinkWithToolTip((`${p.result.dateCreated     }` === '0001-01-01T00:00:00Z' ? ''      : timeStampDisplay(`${p.result.dateCreated     }`)) ?? '', AzureDevOpsHelper.userEntitlementsUrl(organization, p.parameters.descriptor!), 'show details'),
            Markdown.getLinkWithToolTip((`${p.result.lastAccessedDate}` === '0001-01-01T00:00:00Z' ? 'never' : timeStampDisplay(`${p.result.lastAccessedDate}`)) ?? '', AzureDevOpsHelper.userEntitlementsUrl(organization, p.parameters.descriptor!), 'show details')
        ])
    );

    const markdownNeverAccessedLseg = Markdown.table(
        `${organization} - users - ${new Date().toISOString()}- LSEG never`,
        ['displayName', 'principalName', 'dateCreated', 'lastAccessedDate'],
        userEntitlements
            .filter(p => `${p.result.lastAccessedDate}` === '0001-01-01T00:00:00Z')
            .filter(p => `${p.parameters.principalName}`.endsWith('@lseg.com'))
            .map(p => [
            p.parameters.displayName ?? '',
            Markdown.getLinkWithToolTip(`${p.parameters.principalName}`, AzureDevOpsPortalLinks.Permissions(organization,undefined, p.parameters.descriptor!), 'open permissions'),
            Markdown.getLinkWithToolTip((`${p.result.dateCreated     }` === '0001-01-01T00:00:00Z' ? ''      : timeStampDisplay(`${p.result.dateCreated     }`)) ?? '', AzureDevOpsHelper.userEntitlementsUrl(organization, p.parameters.descriptor!), 'show details'),
            Markdown.getLinkWithToolTip((`${p.result.lastAccessedDate}` === '0001-01-01T00:00:00Z' ? 'never' : timeStampDisplay(`${p.result.lastAccessedDate}`)) ?? '', AzureDevOpsHelper.userEntitlementsUrl(organization, p.parameters.descriptor!), 'show details')
        ])
    );

    const markdownNeverAccessedNonLseg = Markdown.table(
        `${organization} - users - ${new Date().toISOString()} - other never`,
        ['displayName', 'principalName', 'dateCreated', 'lastAccessedDate'],
        userEntitlements
            .filter(p => `${p.result.lastAccessedDate}` === '0001-01-01T00:00:00Z')
            .filter(p => `${p.parameters.principalName}`.endsWith('@lseg.com') === false)
            .map(p => [
            p.parameters.displayName ?? '',
            Markdown.getLinkWithToolTip(`${p.parameters.principalName}`, AzureDevOpsPortalLinks.Permissions(organization,undefined, p.parameters.descriptor!), 'open permissions'),
            Markdown.getLinkWithToolTip((`${p.result.dateCreated     }` === '0001-01-01T00:00:00Z' ? ''      : timeStampDisplay(`${p.result.dateCreated     }`)) ?? '', AzureDevOpsHelper.userEntitlementsUrl(organization, p.parameters.descriptor!), 'show details'),
            Markdown.getLinkWithToolTip((`${p.result.lastAccessedDate}` === '0001-01-01T00:00:00Z' ? 'never' : timeStampDisplay(`${p.result.lastAccessedDate}`)) ?? '', AzureDevOpsHelper.userEntitlementsUrl(organization, p.parameters.descriptor!), 'show details')
        ])
    );

    const markdown = `${markdownAll}<br/><br/>${markdownNeverAccessedLseg}<br/><br/>${markdownNeverAccessedNonLseg}`;

    await writeFile(fileHtml, html    );
    await writeFile(fileMd  , markdown);

    console.log({ fileHtml, fileMd });
}, 1000000);

