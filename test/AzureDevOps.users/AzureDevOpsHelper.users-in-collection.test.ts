import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPortalLinks    } from "../../src/AzureDevOpsPortalLinks";
import { GraphUser                 } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Markdown                  } from "../../src/Converters/Markdown";
import { writeFile                 } from "fs/promises";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper                } from "../_TestHelper/TestHelper";

test('AzureDevOpsHelper - users-in-collection', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenant            = config.azureDevOps.tenant;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    const file = await TestHelper.prepareFile([__dirname, 'out', organization, `${organization}-users-in-collection.md`]);

    const users = await azureDevOpsHelper.graphUsersList(organization);

    users.sort((a: GraphUser, b: GraphUser) => `${a.displayName}`.localeCompare(`${b.displayName}`));

    const markdown = Markdown.table(
        organization,
        ['DisplayName', 'PrincipalName'],
        users
        .filter(p => p.domain !== 'Build')
        .map(p => { return [
            Markdown.getLinkWithToolTip(p.displayName   ?? '', p.url ?? ''                                                              , "open details"    ),
            Markdown.getLinkWithToolTip(p.principalName ?? '', AzureDevOpsPortalLinks.Permissions(organization, undefined, p.descriptor), "open permissions")
        ] })
    );

    await writeFile(file, markdown);

    console.log({ file });
}, 100000);
