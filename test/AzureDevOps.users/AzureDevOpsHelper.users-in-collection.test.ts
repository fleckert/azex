import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { rm, writeFile             } from "fs/promises";
import { GraphUser                 } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Markdown                  } from "../../src/Converters/Markdown";
import { AzureDevOpsPortalLinks    } from "../../src/AzureDevOpsPortalLinks";

test('AzureDevOpsHelper - users-in-collection', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenantId          = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

    const file = path.join(__dirname, 'out', `users-in-collection-${organization}.md`);
    await rm(file, { force: true });

    const users = await azureDevOpsHelper.graphUsersList(organization);

    users.sort((a: GraphUser, b: GraphUser) => `${a.displayName}`.localeCompare(`${b.displayName}`));

    const markdown = Markdown.table(
        organization,
        ['DisplayName', 'PrincipalName'],
        users
        .filter(p => p.domain !== 'Build')
        .map(p => { return [
            p.displayName   === undefined ? '' : `[${p.displayName  }](${p.url} "open details")`,
            p.principalName === undefined ? '' : `[${p.principalName}](${AzureDevOpsPortalLinks.Permissions(organization, undefined, p.descriptor)} "open permissions")`
        ] })
    );

    await writeFile(file, markdown);

    console.log({ file });
}, 100000);
