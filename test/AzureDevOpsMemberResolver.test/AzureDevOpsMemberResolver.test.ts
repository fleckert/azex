import   path                             from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsMemberResolver } from "../../src/AzureDevOpsMemberResolver";
import { GraphGroup, GraphMember                } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Markdown                  } from "../../src/Converters/Markdown";
import { rm, writeFile             } from "fs/promises";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsPermissionsMembers', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const projectName       = config.azureDevOps.projectName;
    const tenantId          = config.azureDevOps.tenantId;
    const maxNumberOfTests  = config.azureDevOps.maxNumberOfTests;
    const pathOut           = path.join(__dirname, 'out', `AzureDevOpsPermissionsMembers`);

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const azureDevOpsPermissionsResolver = new AzureDevOpsMemberResolver();

    const groups = await azureDevOpsHelper.graphGroupsListForProjectName(organization, projectName);
    groups.sort((a: GraphGroup, b: GraphGroup) => `${a.principalName}`.toLowerCase().localeCompare(`${b.principalName}`.toLowerCase()));

    for (const group of groups.slice(0, maxNumberOfTests)) {
        if (group.principalName === undefined) {
            continue;
        }

        const principalName = group.principalName;

        const file = `${pathOut}-${principalName.replaceAll(new RegExp('[^a-zA-Z0-9_]', 'g'), '_').replaceAll('__', '_')}.md`;
        await rm(file, { force: true });

        const item = await azureDevOpsPermissionsResolver.resolveGroupMembers(tenantId, organization, principalName);

        const flat = item.flatten();
        
        flat.sort((a: { container: GraphMember, member: GraphMember }, b: { container: GraphMember, member: GraphMember }) => {
            const map = (p: { container: GraphMember, member: GraphMember }) => {
                return `${p.container.principalName}` +
                    (AzureDevOpsHelper.isGraphUser(p.member)
                        ? `${p.member.displayName}`
                        : p.member.principalName)
            };

            return map(a).localeCompare(map(b));
        });

        const linebreak = '<br/>';
        const markdown = Markdown.getMermaidDiagramForHierarchy(
            flat.map(p => {
                return {
                    container: `${p.container.principalName}`,
                    member   : AzureDevOpsHelper.isGraphUser(p.member)
                               ? `${p.member.displayName}${linebreak}${p.member.principalName}`
                               : p.member.principalName
                }
            })
        )

        await writeFile(file, markdown);

        console.log({ file })
    }
}, 1000000);
