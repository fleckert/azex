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
            writeFile(`${path}-${organization}-${project}-${suffixAll    }-mermaid.md`  , Markdown.getMermaidDiagramForHierarchy(groupMembersFlat                                                    .map(mapper)                                 )),
            writeFile(`${path}-${organization}-${project}-${suffix       }-mermaid.md`  , Markdown.getMermaidDiagramForHierarchy(groupMembersFlat.filter(filterProjectValidUsers)                    .map(mapper)                                 )),
            writeFile(`${path}-${organization}-${project}-${suffixNoUsers}-mermaid.md`  , Markdown.getMermaidDiagramForHierarchy(groupMembersFlat.filter(filterProjectValidUsers).filter(filterUsers).map(mapper)                                 )),
            writeFile(`${path}-${organization}-${project}-${suffixAll    }-mermaid.html`, Html    .getMermaidDiagramForHierarchy(groupMembersFlat                                                    .map(mapper), `${titleHtml}-${suffixAll}`    )),
            writeFile(`${path}-${organization}-${project}-${suffix       }-mermaid.html`, Html    .getMermaidDiagramForHierarchy(groupMembersFlat.filter(filterProjectValidUsers)                    .map(mapper), `${titleHtml}-${suffix}`       )),
            writeFile(`${path}-${organization}-${project}-${suffixNoUsers}-mermaid.html`, Html    .getMermaidDiagramForHierarchy(groupMembersFlat.filter(filterProjectValidUsers).filter(filterUsers).map(mapper), `${titleHtml}-${suffixNoUsers}`)),
        ]);

        // ${path}-${organization}-${project}-${suffix}.json
        {
            const groupMembersFlatReduced = groupMembersFlat
                .map(p => {
                    return {
                        container: {
                            displayName  : p.container.displayName,
                            principalName: p.container.principalName,
                            descriptor   : p.container.descriptor
                        },
                        member: {
                            displayName  : p.member.displayName,
                            principalName: p.member.principalName,
                            descriptor   : p.member.descriptor
                        }
                    }
                });

            groupMembersFlatReduced.sort(
                (
                    a: { container: { displayName: string | undefined }, member: { displayName: string | undefined } },
                    b: { container: { displayName: string | undefined }, member: { displayName: string | undefined } }
                ) => {

                    return `${a.container.displayName}${a.member.displayName}`.localeCompare(`${b.container.displayName}${b.member.displayName}`);
                }
            );

            await writeFile(`${path}-${organization}-${project}-${suffix}.json`, JSON.stringify(groupMembersFlatReduced, null, 2));
        }

        // ${path}-${organization}-${project}-${suffix}.min.json
        {
            const groupMembersFlatReduced = groupMembersFlat
                .map(p => {
                    return {
                        container: p.container.principalName,
                        member: p.member.principalName
                    }
                });

            groupMembersFlatReduced.sort(
                (
                    a: { container: string | undefined, member: string | undefined },
                    b: { container: string | undefined, member: string | undefined }
                ) => {

                    return `${a.container}${a.member}`.localeCompare(`${b.container}${b.member}`);
                }
            );

            await writeFile(`${path}-${organization}-${project}-${suffix}.min.json`, JSON.stringify(groupMembersFlatReduced, null, 2));
        }

        // ${path}-${organization}-${project}-${suffix}.min.md
        {
            groupMembersFlat.sort(
                (
                    a: { container: GraphMember, member: GraphMember },
                    b: { container: GraphMember, member: GraphMember }
                ) => {

                    return `${a.container.principalName}${a.member.principalName}`.localeCompare(`${b.container.principalName}${b.member.principalName}`);
                }
            );

            await writeFile(
                `${path}-${organization}-${project}-${suffix}.min.md`,
                Markdown.table(
                    `${organization}-${project}`,
                    ['container', 'member'],
                    groupMembersFlat.map(p => [`${p.container.principalName}`, `${p.member.principalName}`])
                )
            );
        }

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
                    reduced: `${path}-${organization}-${project}-${suffix       }.json`,
                    min    : `${path}-${organization}-${project}-${suffix   }.min.json`
                },
                markdown: {
                    all    : `${path}-${organization}-${project}-${suffixAll    }-mermaid.md`,
                    reduced: `${path}-${organization}-${project}-${suffix       }-mermaid.md`,
                    noUser : `${path}-${organization}-${project}-${suffixNoUsers}-mermaid.md`,
                    min    : `${path}-${organization}-${project}-${suffix       }.min.md`
                },
                html: {
                    all    : `${path}-${organization}-${project}-${suffixAll    }-mermaid.html`,
                    reduced: `${path}-${organization}-${project}-${suffix       }-mermaid.html`,
                    noUser : `${path}-${organization}-${project}-${suffixNoUsers}-mermaid.html`
                }
            }
        });
    }
}
