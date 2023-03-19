import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPortalLinks    } from "../../src/AzureDevOpsPortalLinks";
import { GraphUser                 } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Markdown                  } from "../../src/Converters/Markdown";
import { rm, mkdir, writeFile      } from "fs/promises";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - users-in-collection', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenant            = config.azureDevOps.tenant;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    await mkdir(path.join(__dirname, 'out', organization), { recursive: true });
    const file = path.join(__dirname, 'out', organization, `users-in-collection-${organization}.md`);
    await rm(file, { force: true });

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
