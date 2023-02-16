import   path                             from "path";
import { AzureDevOpsHelper              } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsPermissionsResolver } from "../../src/AzureDevOpsPermissionsResolver";
import { GraphMember                    } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Html                           } from "../../src/Converters/Html";
import { Markdown                       } from "../../src/Converters/Markdown";
import { TestConfigurationProvider      } from "../_Configuration/TestConfiguration";
import { writeFile                      } from "fs/promises";

test('AzureDevOpsPermissionsResolver-resolveGraphSubjectMemberOf', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const projectName  = config.azureDevOps.projectName;
    const tenantId     = config.azureDevOps.tenantId;
    const pathOut      = path.join(__dirname, 'out', `azex-test-AzureDevOpsPermissionsResolver-resolveGraphSubjectMemberOf`);

    const azureDevOpsPermissionsResolver = new AzureDevOpsPermissionsResolver();
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);


    const users = await azureDevOpsHelper.graphUsersList(config.azureDevOps.organization);
    await writeFile(`${pathOut}-users.json`, JSON.stringify(users, null, 2));

    const maxNumerOfTests = 5;

    for (const graphSubject of users.slice(0, maxNumerOfTests)) {
        if (graphSubject.descriptor === undefined) { throw new Error("graphSubject.descriptor === undefined"); }

        const graphSubjectMemberOf = await azureDevOpsPermissionsResolver.resolveGraphSubjectMemberOf(tenantId, organization, projectName, graphSubject.descriptor);

        const groupMembersFlat = azureDevOpsPermissionsResolver.flattenGraphSubjectMemberOf(graphSubjectMemberOf);

        const mapper = (item: { container: GraphMember, member: GraphMember }) => { return { container: item.container.principalName, member: item.member.principalName } };

        
        const title = `${organization                                 }-`
                    + `${projectName                                  }-`
                    + `${graphSubjectMemberOf.graphSubject.subjectKind}-`
                    + `${graphSubjectMemberOf.graphSubject.displayName}-`
                    + `${graphSubjectMemberOf.graphSubject.originId   }`;

        await Promise.all([
            writeFile(`${pathOut}-${title}.md`  , Markdown.getMermaidDiagramForHierarchy(groupMembersFlat.map(mapper)      )),
            writeFile(`${pathOut}-${title}.html`, Html    .getMermaidDiagramForHierarchy(groupMembersFlat.map(mapper),title)),
        ]);
    }
}, 100000);
