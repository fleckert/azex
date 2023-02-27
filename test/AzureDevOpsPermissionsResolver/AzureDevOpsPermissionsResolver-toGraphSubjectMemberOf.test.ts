import   path                             from "path";
import { GraphMember                    } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { writeFile                      } from "fs/promises";
import { AzureDevOpsPermissionsResolver } from "../../src/AzureDevOpsPermissionsResolver";
import { Markdown                       } from "../../src/Converters/Markdown";
import { Html                           } from "../../src/Converters/Html";
import { TestConfigurationProvider      } from "../_Configuration/TestConfiguration";

test('AzureDevOpsPermissionsResolver-toGraphSubjectMemberOf', async () => {
    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const projectName  = config.azureDevOps.projectName;
    const tenantId     = config.azureDevOps.tenantId;
    const azureDevOpsPermissionsResolver = new AzureDevOpsPermissionsResolver();

    const items = await azureDevOpsPermissionsResolver.resolveGroupMembers(tenantId, organization, projectName);

    if (items.length === 0) { throw new Error(JSON.stringify({ organization, projectName })); }

    const collection = azureDevOpsPermissionsResolver.toGraphSubjectMemberOf(items);

    for (const graphSubjectMemberOf of collection) {
        const groupMembersFlat = azureDevOpsPermissionsResolver.flattenGraphSubjectMemberOf(graphSubjectMemberOf);

        const mapper = (item: { container: GraphMember, member: GraphMember }) => { return { container: item.container.principalName, member: item.member.principalName } };

        const pathOut = path.join(__dirname, 'out', `azex-test-AzureDevOpsPermissionsResolver-toGraphSubjectMemberOf`);
        const title   = `${organization}-${projectName}-${graphSubjectMemberOf.graphSubject.subjectKind}-${graphSubjectMemberOf.graphSubject.displayName}-${graphSubjectMemberOf.graphSubject.originId}`;

        await Promise.all([
            writeFile(`${pathOut}-${title}.md`  , Markdown.getMermaidDiagramForHierarchy(groupMembersFlat.map(mapper)       )),
            writeFile(`${pathOut}-${title}.html`, Html    .getMermaidDiagramForHierarchy(groupMembersFlat.map(mapper), title)),
        ]);
    }
}, 100000);
