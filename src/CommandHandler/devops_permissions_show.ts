import { AzureDevOpsHelper              } from "../AzureDevOpsHelper";
import { AzureDevOpsPermissionsResolver } from "../AzureDevOpsPermissionsResolver";
import { GraphMember                    } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Html                           } from "../Converters/Html";
import { Markdown                       } from "../Converters/Markdown";
import { writeFile                      } from "fs/promises";

export class devops_permissions_show {
    static async handle(tenantId: string, organization: string, project: string | undefined, principalName: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsPermissionsResolver = new AzureDevOpsPermissionsResolver();
        const azureDevOpsHelper              = new AzureDevOpsHelper             (tenantId);
        
        const graphSubject = await azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, ['User', 'Group'], principalName);

        if (graphSubject?.descriptor === undefined) {
            throw new Error(`Failed to resolve graphSubject.descriptor for ${JSON.stringify({organization, principalName})}.`);
        }
        else {
            const subjectDescriptor = graphSubject.descriptor;

            const graphSubjectMemberOf = await azureDevOpsPermissionsResolver.resolveGraphSubjectMemberOf(tenantId, organization, project, subjectDescriptor);

            const groupMembersFlat = azureDevOpsPermissionsResolver.flattenGraphSubjectMemberOf(graphSubjectMemberOf);
    
            const mapper = (item: { container: GraphMember, member: GraphMember }) => { return { container: item.container.principalName, member: item.member.principalName } };
    
            const title = `${organization                                       }-`
                        + `${project ===undefined ? '': `${project}-`           }`
                        + `${graphSubjectMemberOf.graphSubject.subjectKind}-`
                        + `${principalName.replaceAll('\\','_')                 }`;
    
            await Promise.all([
                writeFile(`${path}-${title}.md`  , Markdown.getMermaidDiagramForHierarchy(groupMembersFlat.map(mapper)      )),
                writeFile(`${path}-${title}.html`, Html    .getMermaidDiagramForHierarchy(groupMembersFlat.map(mapper),title)),
            ]);

            console.log({
                parameters: {
                    organization,
                    project,
                    principalName,
                    path
                },
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000,
                files: {
                    markdown: `${path}-${title}.md`,
                    html    : `${path}-${title}.html`
                }
            });
        }
    }
}