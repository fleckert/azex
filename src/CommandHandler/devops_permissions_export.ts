import { AzureDevOpsPermissionsResolver } from "../AzureDevOpsPermissionsResolver";
import { GraphMember                    } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Html                           } from "../Converters/Html";
import { Markdown                       } from "../Converters/Markdown";
import { writeFile                      } from "fs/promises";

export class devops_permissions_export {
    static async handle(tenantId: string, organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsPermissionsResolver = new AzureDevOpsPermissionsResolver();

        const result = await azureDevOpsPermissionsResolver.resolveGroupMembers(tenantId, organization, project);

        await writeFile(`${path}-${organization}-${project}-groupMembers.json`, JSON.stringify(result, null, 2));

        const groupMembersFlat = azureDevOpsPermissionsResolver.flattenGraphMembers(result.map(p => { return { container: p.group as GraphMember, members: p.members.map(n => n as GraphMember) } }));
        
        const mapper                  = (item: { container: GraphMember, member: GraphMember }) => { return { container: item.container.principalName, member: item.member.principalName } };
        const filterProjectValidUsers = (item: { container: GraphMember, member: GraphMember }) => `${item.container.principalName}`.indexOf('Project Valid Users') < 0;
        const filterUsers             = (item: { container: GraphMember, member: GraphMember }) => `${item.member.subjectKind?.toLowerCase()}` !== 'user';
        
        const titleHtml     = `${organization}-${project}`;
        const suffixAll     = "permissions-all";
        const suffixNoUsers = "permissions-noUsers";
        const suffix        = "permissions";

        await Promise.all([
            writeFile(`${path}-${organization}-${project}-${suffixAll    }.md`  , Markdown.getMermaidDiagramForHierarchy(groupMembersFlat                                                    .map(mapper)                                 )),
            writeFile(`${path}-${organization}-${project}-${suffix       }.md`  , Markdown.getMermaidDiagramForHierarchy(groupMembersFlat.filter(filterProjectValidUsers)                    .map(mapper)                                 )),
            writeFile(`${path}-${organization}-${project}-${suffixNoUsers}.md`  , Markdown.getMermaidDiagramForHierarchy(groupMembersFlat.filter(filterProjectValidUsers).filter(filterUsers).map(mapper)                                 )),
            writeFile(`${path}-${organization}-${project}-${suffixAll    }.html`, Html    .getMermaidDiagramForHierarchy(groupMembersFlat                                                    .map(mapper), `${titleHtml}-${suffixAll}`    )),
            writeFile(`${path}-${organization}-${project}-${suffix       }.html`, Html    .getMermaidDiagramForHierarchy(groupMembersFlat.filter(filterProjectValidUsers)                    .map(mapper), `${titleHtml}-${suffix}`       )),
            writeFile(`${path}-${organization}-${project}-${suffixNoUsers}.html`, Html    .getMermaidDiagramForHierarchy(groupMembersFlat.filter(filterProjectValidUsers).filter(filterUsers).map(mapper), `${titleHtml}-${suffixNoUsers}`)),
        ]);

        const groupMembersFlatReduced = groupMembersFlat
            .map(p => {
                return {
                    container: {
                        principalName: p.container.principalName,
                        descriptor   : p.container.descriptor
                    },
                    member: {
                        principalName: p.member.principalName,
                        descriptor   : p.member.descriptor
                    }
                }
            });

        groupMembersFlatReduced.sort(
            (
                a: { container: { principalName: string | undefined }, member: { principalName: string | undefined } }, 
                b: { container: { principalName: string | undefined }, member: { principalName: string | undefined } }
            ) => {

                return `${a.container.principalName}${a.member.principalName}`.localeCompare(`${b.container.principalName}${b.member.principalName}`);
            }
        );

        await writeFile(`${path}-${organization}-${project}-${suffix}.json`, JSON.stringify(groupMembersFlatReduced, null, 2));

        console.log({
            parameters: {
                organization,
                project,
                path
            },
            durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000,
            files: {
                json: {
                    full   : `${path}-${organization}-${project}-${suffixAll    }.json`,
                    reduced: `${path}-${organization}-${project}-${suffix       }.json`
                },
                markdown: {
                    all    : `${path}-${organization}-${project}-${suffixAll    }.md`,
                    reduced: `${path}-${organization}-${project}-${suffix       }.md`,
                    noUser : `${path}-${organization}-${project}-${suffixNoUsers}.md`
                },
                html: {
                    all    : `${path}-${organization}-${project}-${suffixAll    }.html`,
                    reduced: `${path}-${organization}-${project}-${suffix       }.html`,
                    noUser : `${path}-${organization}-${project}-${suffixNoUsers}.html`
                }
            }
        });
    }
}