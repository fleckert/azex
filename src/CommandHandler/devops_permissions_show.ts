import { AzureDevOpsHelper              } from "../AzureDevOpsHelper";
import { AzureDevOpsPermissionsResolver } from "../AzureDevOpsPermissionsResolver";
import { GraphMember                    } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Html                           } from "../Converters/Html";
import { Markdown                       } from "../Converters/Markdown";
import { writeFile                      } from "fs/promises";

export class devops_permissions_show {
    static async handle(organization: string, project: string, principalName: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsPermissionsResolver = new AzureDevOpsPermissionsResolver();
        const azureDevOpsHelper              = new AzureDevOpsHelper             ();
        
        const graphSubject = await azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, ['User', 'Group'], principalName);

        if (graphSubject.error !== undefined) {
            throw new Error(`Failed to resolve graphSubject for Azure DevOps organization '${organization}' and principalName '${principalName}'. [${graphSubject.error}]`);
        }
        else if (graphSubject.value === undefined) {
            throw new Error(`Failed to resolve graphSubject for Azure DevOps organization '${organization}' and principalName '${principalName}'.`);
        }
        else if (graphSubject.value.descriptor === undefined) {
            throw new Error(`Failed to resolve graphSubject.descriptor for Azure DevOps organization '${organization}' and principalName '${principalName}'.`);
        }
        else {
            const graphSubjectMemberOf = await azureDevOpsPermissionsResolver.resolveGraphSubjectMemberOf(organization, project, graphSubject.value.descriptor);

            if (graphSubjectMemberOf.error !== undefined) { throw graphSubjectMemberOf.error; }
            if (graphSubjectMemberOf.value === undefined) { throw new Error("graphSubjectMemberOf.value === undefined"); }
    
            const groupMembersFlat = azureDevOpsPermissionsResolver.flattenGraphSubjectMemberOf(graphSubjectMemberOf.value);
    
            const mapper = (item: { container: GraphMember, member: GraphMember }) => { return { container: item.container.principalName, member: item.member.principalName } };
    
            const title = `${organization                                       }-`
                        + `${project                                            }-`
                        + `${graphSubjectMemberOf.value.graphSubject.subjectKind}-`
                        + `${principalName.replaceAll('\\','').replaceAll('[','') .replaceAll(']','')}`;
    
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
                files: [
                    `${path}-${title}.md`,
                    `${path}-${title}.html`
                ]
            });
        }
    }
}