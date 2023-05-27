import { AzureDevOpsHelper                 } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPortalLinks            } from "../../src/AzureDevOpsPortalLinks";
import { GraphGroup, GraphServicePrincipal } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Markdown                          } from "../../src/Converters/Markdown";
import { TestConfigurationProvider         } from "../_Configuration/TestConfiguration";
import { TestHelper                        } from "../_TestHelper/TestHelper";
import { writeFile                         } from "fs/promises";

test('AzureDevOpsHelper_servicePrincipals', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const projectName      = config.azureDevOps.projectName;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    const file = await TestHelper.prepareFile([__dirname, 'out', organization, `${organization}-${projectName}-servicePrincipals-in-project-groups.md`]);

    const scopeDescriptor = await azureDevOpsHelper.graphDescriptorForProjectName(organization, projectName);

    const servicePrincipalsPromise =       azureDevOpsHelper.graphServicePrincipalsListForScopeDescriptor(organization, scopeDescriptor                  );
    const groups                   = await azureDevOpsHelper.graphGroupsListForScopeDescriptor           (organization, scopeDescriptor, maxNumberOfTests);

    const membershipsAll = await azureDevOpsHelper.graphMembershipsLists(
        groups
        .filter(group => group.descriptor !== undefined)
        .map(group => { return { organization, subjectDescriptor: group.descriptor!, direction: 'down' } })
    );

    const servicePrincipals = await servicePrincipalsPromise;

    const groupsServicePrincipals = new Array<{ group: GraphGroup, servicePrincipal: GraphServicePrincipal }>

    for (const group of groups) {
        if (group.descriptor === undefined) {
            continue;
        }
        const subjectDescriptor = group.descriptor;
        const memberships = membershipsAll.find(p => p.parameters.subjectDescriptor === subjectDescriptor);
        if (memberships === undefined) {
            throw new Error(JSON.stringify({ error: 'Failed to resolve graphMemberships', organization, projectName, subjectDescriptor }));
        }

        for (const membership of memberships.result) {
            const servicePrincipal = servicePrincipals.find(p => p.descriptor === membership.memberDescriptor);
            if (servicePrincipal !== undefined) {
                groupsServicePrincipals.push({group, servicePrincipal});
            }
        }
    }

    groupsServicePrincipals.sort(
        (a: { group: GraphGroup, servicePrincipal: GraphServicePrincipal }, 
         b: { group: GraphGroup, servicePrincipal: GraphServicePrincipal }
        ) => `${a.group.displayName}-${a.servicePrincipal.displayName}`.toLowerCase().localeCompare(`${b.group.displayName}-${b.servicePrincipal.displayName}`.toLowerCase()));

    const markdown = Markdown.table(
        `${organization} / ${projectName}`,
        ['Group', 'ServicePrincipal'], 
        groupsServicePrincipals.map(p => [
            Markdown.getLinkWithToolTip(p.group.principalName ?? '', AzureDevOpsPortalLinks.Permissions(organization, projectName, p.group.descriptor), "open permissions"),
            p.servicePrincipal.displayName + '<br/>'+
            Markdown.getLinkWithToolTip(p.servicePrincipal.principalName ?? '', AzureDevOpsPortalLinks.Permissions(organization, projectName, p.servicePrincipal .descriptor), "open permissions")
        ])
    );
 
    await writeFile(file, markdown);

    console.log({ file });
}, 100000);