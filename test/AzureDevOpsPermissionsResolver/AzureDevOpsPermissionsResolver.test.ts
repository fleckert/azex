import   path                                      from "path";
import { GraphMember                             } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { writeFile                               } from "fs/promises";
import { AzureDevOpsPermissionsResolver          } from "../../src/AzureDevOpsPermissionsResolver";
import { AzureDevOpsPermissionsHierarchyResolver } from "../../src/AzureDevOpsPermissionsHierarchyResolver";
import { Markdown                                } from "../../src/Converters/Markdown";
import { Html                                    } from "../../src/Converters/Html";
import { TestConfigurationProvider               } from "../_Configuration/TestConfiguration";

test('AzureDevOpsPermissionsResolver', async () => {
    const config = await TestConfigurationProvider.get();

    const { items, error } = await new AzureDevOpsPermissionsResolver().resolve(config.azureDevOps.organization, config.azureDevOps.projectName);

    if (error !== undefined) { throw error; }
    if (items === undefined) { throw new Error("items === undefined"); }

    const graphSubjects = new AzureDevOpsPermissionsHierarchyResolver().getGraphSubjects(items);

    for (const graphSubject of graphSubjects) {
        const graphSubjectMemberOf = new AzureDevOpsPermissionsHierarchyResolver().getHierarchy(graphSubject, items);

        const groupMembersFlat = new AzureDevOpsPermissionsHierarchyResolver().flattenHierarchy(graphSubjectMemberOf);

        const mapper = (item: { container: GraphMember, member: GraphMember }) => { return { container: item.container.principalName, member: item.member.principalName } };

        const pathOut = path.join(__dirname, 'out', `azex-test-devops-permissions-hierarchy`);
        const title   = `${config.azureDevOps.organization}-${config.azureDevOps.projectName}-${graphSubjectMemberOf.graphSubject.subjectKind}-${graphSubjectMemberOf.graphSubject.displayName}-${graphSubjectMemberOf.graphSubject.originId}`;

        await Promise.all([
            writeFile(`${pathOut}-${title}.md`  , Markdown.getMermaidDiagramForHierarchy(groupMembersFlat.map(mapper)      )),
            writeFile(`${pathOut}-${title}.html`, Html    .getMermaidDiagramForHierarchy(groupMembersFlat.map(mapper),title)),
        ]);
    }
}, 100000);
