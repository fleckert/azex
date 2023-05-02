import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPortalLinks    } from "../../src/AzureDevOpsPortalLinks";
import { GraphUser                 } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Markdown                  } from "../../src/Converters/Markdown";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper                } from "../_TestHelper/TestHelper";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsHelper.users-domain-check.test.ts', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;

    const validUserDomains : Array<string> = [
        //'company.com'
    ];

    if (validUserDomains.length === 0) { return; }

    const file = await TestHelper.prepareFile([__dirname, 'out', organization, `${organization}-users-domain-check.md`]);

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    const users = await azureDevOpsHelper.graphUsersList(organization, maxNumberOfTests);

    const usersInvalid = new Array<GraphUser>();

    for (const user of users) {
        if (user.principalName === undefined) { continue; }
        if (user.descriptor    === undefined) { continue; }
        const parts = user.principalName.split('@');
        if (parts.length !== 2) { continue; }

        const userDomain = parts[1];
        const userDomainIsValid = validUserDomains.find(p => p.toLowerCase() === userDomain.toLowerCase()) !== undefined;

        if (userDomainIsValid === false) {
            usersInvalid.push(user);
        }
    }

    usersInvalid.sort((a, b) => `${a.displayName}`.toLowerCase().localeCompare(`${b.displayName}`.toLowerCase()));

    const markdown = Markdown.table(
        `${organization} - users without valid domains [ ${validUserDomains.join('\'')} ]`,
        [ 'displayName', 'principalName' ],
        usersInvalid.map(p => [
            Markdown.getLinkWithToolTip(`${p.displayName  }`, AzureDevOpsPortalLinks.Permissions(organization,undefined, p.descriptor!), `open permissions for ${p.principalName}`),
            Markdown.getLinkWithToolTip(`${p.principalName}`, AzureDevOpsPortalLinks.Permissions(organization,undefined, p.descriptor!), `open permissions for ${p.principalName}`),
        ])
    );

    await writeFile(file, markdown);

    console.log({ file });
}, 100000)
