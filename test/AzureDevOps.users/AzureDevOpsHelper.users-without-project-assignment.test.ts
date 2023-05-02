import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPortalLinks    } from "../../src/AzureDevOpsPortalLinks";
import { GraphUser                 } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Helper                    } from "../../src/Helper";
import { Markdown                  } from "../../src/Converters/Markdown";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper                } from "../_TestHelper/TestHelper";
import { writeFile                 } from "fs/promises";

test('AzureDevOpsHelper - users-without-project-assignment', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;
    
    const azureDevOpsHelper  = await AzureDevOpsHelper.instance(tenant);

    const file = await TestHelper.prepareFile([__dirname, 'out', organization, `${organization}-users-without-project-assignment.md`]);

    const users = await azureDevOpsHelper.graphUsersList(organization, maxNumberOfTests);
    const usersFiltered = users.filter(user => user.descriptor?.startsWith('svc.') === false);

    usersFiltered.sort((a: GraphUser, b: GraphUser) => `${a.displayName}`.localeCompare(`${b.displayName}`));

    const usersWithoutProjectAssignments = new Array<GraphUser>();

    const userEntitlements = await Helper.batchCalls(
        usersFiltered
            .filter(user => user.descriptor !== undefined)
            .map(user => user.descriptor!)
            .map(descriptor => { return { organization, descriptor } }),
        p => azureDevOpsHelper.userEntitlements(p.organization, p.descriptor)
    );

    for (const user of usersFiltered) {
        if (user.descriptor === undefined) {
            continue;
        }

        const userEntitlement = userEntitlements.find(p => p.parameters.descriptor === user.descriptor);

        if (userEntitlement === undefined) {
            throw new Error(JSON.stringify({ user }));
        }
        else if ('projectEntitlements' in userEntitlement.result === false) {
            throw new Error(JSON.stringify({ user, userEntitlement }));
        }
        else if (userEntitlement.result.projectEntitlements.length === 0) {
            usersWithoutProjectAssignments.push(user);
        }
    }

    const markdown = Markdown.table(
        `${organization} - Users without project entitlements`,
        ['DisplayName', 'PrincipalName'],
        usersWithoutProjectAssignments.map(p => [
            Markdown.getLinkWithToolTip(p.displayName   ?? '', p.url ?? ''                                                              , "open details"    ),
            Markdown.getLinkWithToolTip(p.principalName ?? '', AzureDevOpsPortalLinks.Permissions(organization, undefined, p.descriptor), "open permissions")
        ])
    );
    
    await writeFile(file, markdown);

    console.log({ file });
}, 100000);