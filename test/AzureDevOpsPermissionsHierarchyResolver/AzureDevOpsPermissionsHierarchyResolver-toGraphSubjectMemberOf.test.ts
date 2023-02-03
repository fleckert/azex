import   path                                         from "path";
import { GraphMember                             } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { writeFile                               } from "fs/promises";
import { AzureDevOpsPermissionsResolver          } from "../../src/AzureDevOpsPermissionsResolver";
import { AzureDevOpsPermissionsHierarchyResolver } from "../../src/AzureDevOpsPermissionsHierarchyResolver";
import { Markdown                                } from "../../src/Converters/Markdown";
import { Html                                    } from "../../src/Converters/Html";
import { TestConfigurationProvider               } from "../_Configuration/TestConfiguration";

test('AzureDevOpsPermissionsHierarchyResolver-toGraphSubjectMemberOf', async () => {
    const config = await TestConfigurationProvider.get();

    const { items, error } = await new AzureDevOpsPermissionsResolver().resolveGroupMembers(config.azureDevOps.organization, config.azureDevOps.projectName);

    if (error !== undefined) { throw error; }
    if (items === undefined) { throw new Error("items === undefined"); }

    const collection = new AzureDevOpsPermissionsHierarchyResolver().toGraphSubjectMemberOf(items);

    for (const graphSubjectMemberOf of collection) {
        const groupMembersFlat = new AzureDevOpsPermissionsHierarchyResolver().flattenGraphSubjectMemberOf(graphSubjectMemberOf);

        const mapper = (item: { container: GraphMember, member: GraphMember }) => { return { container: item.container.principalName, member: item.member.principalName } };

        const pathOut = path.join(__dirname, 'out', `azex-test-AzureDevOpsPermissionsHierarchyResolver-toGraphSubjectMemberOf`);
        const title   = `${config.azureDevOps.organization}-${config.azureDevOps.projectName}-${graphSubjectMemberOf.graphSubject.subjectKind}-${graphSubjectMemberOf.graphSubject.displayName}-${graphSubjectMemberOf.graphSubject.originId}`;

        await Promise.all([
            writeFile(`${pathOut}-${title}.md`  , Markdown.getMermaidDiagramForHierarchy(groupMembersFlat.map(mapper)      )),
            writeFile(`${pathOut}-${title}.html`, Html    .getMermaidDiagramForHierarchy(groupMembersFlat.map(mapper),title)),
        ]);
    }
}, 100000);
