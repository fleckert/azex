import   path                                      from "path";
import { AzureDevOpsHelper                       } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPermissionsHierarchyResolver } from "../../src/AzureDevOpsPermissionsHierarchyResolver";
import { GraphMember                             } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Html                                    } from "../../src/Converters/Html";
import { Markdown                                } from "../../src/Converters/Markdown";
import { TestConfigurationProvider               } from "../_Configuration/TestConfiguration";
import { writeFile                               } from "fs/promises";

test('AzureDevOpsPermissionsHierarchyResolver-resolve', async () => {

    const azureDevOpsPermissionsHierarchyResolver = new AzureDevOpsPermissionsHierarchyResolver();
    const azureDevOpsHelper                       = new AzureDevOpsHelper                      ();

    const config = await TestConfigurationProvider.get();

    const users = await azureDevOpsHelper.graphUsersList(config.azureDevOps.organization);

    if (users.error !== undefined) { throw users.error; }
    if (users.value === undefined) { throw new Error("users.value === undefined"); }

    for (const graphSubject of users.value.slice(0,10)) {
        if (graphSubject.descriptor === undefined) { throw new Error("graphSubject.descriptor === undefined"); }

        const graphSubjectMemberOf = await azureDevOpsPermissionsHierarchyResolver.resolveGraphSubjectMemberOf(config.azureDevOps.organization, config.azureDevOps.projectName, graphSubject.descriptor);

        if (graphSubjectMemberOf.error !== undefined) { throw graphSubjectMemberOf.error; }
        if (graphSubjectMemberOf.value === undefined) { throw new Error("graphSubjectMemberOf.value === undefined"); }

        const groupMembersFlat = azureDevOpsPermissionsHierarchyResolver.flattenGraphSubjectMemberOf(graphSubjectMemberOf.value);

        const mapper = (item: { container: GraphMember, member: GraphMember }) => { return { container: item.container.principalName, member: item.member.principalName } };

        const pathOut = path.join(__dirname, 'out', `azex-test-AzureDevOpsPermissionsHierarchyResolver-resolve-`);
        const title = `${config.azureDevOps.organization                    }-`
                    + `${config.azureDevOps.projectName                     }-`
                    + `${graphSubjectMemberOf.value.graphSubject.subjectKind}-`
                    + `${graphSubjectMemberOf.value.graphSubject.displayName}-`
                    + `${graphSubjectMemberOf.value.graphSubject.originId   }`;

        await Promise.all([
            writeFile(`${pathOut}-${title}.md`  , Markdown.getMermaidDiagramForHierarchy(groupMembersFlat.map(mapper)      )),
            writeFile(`${pathOut}-${title}.html`, Html    .getMermaidDiagramForHierarchy(groupMembersFlat.map(mapper),title)),
        ]);
    }
}, 100000);
