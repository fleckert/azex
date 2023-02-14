import   path                             from "path";
import { AzureDevOpsHelper              } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPermissionsResolver } from "../../src/AzureDevOpsPermissionsResolver";
import { GraphMember                    } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Html                           } from "../../src/Converters/Html";
import { Markdown                       } from "../../src/Converters/Markdown";
import { TestConfigurationProvider      } from "../_Configuration/TestConfiguration";
import { writeFile                      } from "fs/promises";

test('AzureDevOpsPermissionsResolver-resolveGraphSubjectMemberOf', async () => {

    const azureDevOpsPermissionsResolver = new AzureDevOpsPermissionsResolver();
    const azureDevOpsHelper              = new AzureDevOpsHelper             ();
    const pathOut = path.join(__dirname, 'out', `azex-test-AzureDevOpsPermissionsResolver-resolveGraphSubjectMemberOf`);

    const config = await TestConfigurationProvider.get();

    const users = await azureDevOpsHelper.graphUsersList(config.azureDevOps.organization);
    if (users.error !== undefined) { throw users.error; }
    if (users.value === undefined) { throw new Error("users.value === undefined"); }
    await writeFile(`${pathOut}-users.json`, JSON.stringify(users.value, null, 2));

    const maxNumerOfTests = 5;

    for (const graphSubject of users.value.slice(0, maxNumerOfTests)) {
        if (graphSubject.descriptor === undefined) { throw new Error("graphSubject.descriptor === undefined"); }

        const graphSubjectMemberOf = await azureDevOpsPermissionsResolver.resolveGraphSubjectMemberOf(config.azureDevOps.organization, config.azureDevOps.projectName, graphSubject.descriptor);

        if (graphSubjectMemberOf.error !== undefined) { throw graphSubjectMemberOf.error; }
        if (graphSubjectMemberOf.value === undefined) { throw new Error("graphSubjectMemberOf.value === undefined"); }

        const groupMembersFlat = azureDevOpsPermissionsResolver.flattenGraphSubjectMemberOf(graphSubjectMemberOf.value);

        const mapper = (item: { container: GraphMember, member: GraphMember }) => { return { container: item.container.principalName, member: item.member.principalName } };

        
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
