import { AzureDevOpsPermissionsResolver } from "../AzureDevOpsPermissionsResolver";
import { GraphSubject, GraphMember      } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Html                           } from "../Converters/Html";
import { Markdown                       } from "../Converters/Markdown";
import { writeFile                      } from "fs/promises";

export class devops_permissions_export {
    static async handle(organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsPermissionsResolver = new AzureDevOpsPermissionsResolver();

        try {
            const result = await azureDevOpsPermissionsResolver.resolve(organization, project);

            if (result.error !== undefined) {
                throw new Error(`Failed to resolve permissions for Azure DevOps organization '${organization}' and project '${project}'. [${result.error}]`);
            }
            else if (result.items === undefined) {
                throw new Error(`Failed to resolve permissions for Azure DevOps organization '${organization}' and project '${project}'.`);
            }
            else {
                await writeFile(`${path}-${organization}-${project}-groupMembers.json`, JSON.stringify(result.items, null, 2));

                const groupMembersFlat = azureDevOpsPermissionsResolver.getContainerMembersFlat(result.items.map(p => { return { container: p.group as GraphMember, members: p.members.map(n => n as GraphMember) } }));
                
                const mapper                  = (item: { container: GraphMember, member: GraphMember }) => { return { container: item.container.principalName, member: item.member.principalName } };
                const filterProjectValidUsers = (item: { container: GraphMember, member: GraphMember }) => `${item.container.principalName}`.indexOf('Project Valid Users') < 0;
                const filterUsers             = (item: { container: GraphMember, member: GraphMember }) => `${item.member.subjectKind?.toLowerCase()}` !== 'user';
                
                const titleHtml     = `${organization}-${project}`;
                const suffixAll     = "groupMembers-all";
                const suffixNoUsers = "groupMembers-noUsers";
                const suffix        = "groupMembers";

                await Promise.all([
                    writeFile(`${path}-${organization}-${project}-${suffixAll    }.md`  , Markdown.getMermaidDiagramForHierarchy(                                 groupMembersFlat                                                    .map(mapper))),
                    writeFile(`${path}-${organization}-${project}-${suffix       }.md`  , Markdown.getMermaidDiagramForHierarchy(                                 groupMembersFlat.filter(filterProjectValidUsers)                    .map(mapper))),
                    writeFile(`${path}-${organization}-${project}-${suffixNoUsers}.md`  , Markdown.getMermaidDiagramForHierarchy(                                 groupMembersFlat.filter(filterProjectValidUsers).filter(filterUsers).map(mapper))),
                    writeFile(`${path}-${organization}-${project}-${suffixAll    }.html`, Html    .getMermaidDiagramForHierarchy(`${titleHtml}-${suffixAll}`    , groupMembersFlat                                                    .map(mapper))),
                    writeFile(`${path}-${organization}-${project}-${suffix       }.html`, Html    .getMermaidDiagramForHierarchy(`${titleHtml}-${suffix}`       , groupMembersFlat.filter(filterProjectValidUsers)                    .map(mapper))),
                    writeFile(`${path}-${organization}-${project}-${suffixNoUsers}.html`, Html    .getMermaidDiagramForHierarchy(`${titleHtml}-${suffixNoUsers}`, groupMembersFlat.filter(filterProjectValidUsers).filter(filterUsers).map(mapper))),
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

                await writeFile(`${path}-${organization}-${project}-groupMembers-reduced.json`, JSON.stringify(groupMembersFlatReduced, null, 2));


                console.log({
                    parameters: {
                        organization,
                        project,
                        path
                    },
                    durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000,
                    files: [
                        `${path}-${organization}-${project}-groupMembers.json`,
                        `${path}-${organization}-${project}-groupMembers-reduced.json`,
                        `${path}-${organization}-${project}-groupMembers-all.md`,
                        `${path}-${organization}-${project}-groupMembers.md`,
                        `${path}-${organization}-${project}-groupMembers-noUser.md`,
                        `${path}-${organization}-${project}-groupMembers-all.html`,
                        `${path}-${organization}-${project}-groupMembers.html`,
                        `${path}-${organization}-${project}-groupMembers-noUser.html`
                    ]
                });
            }
        } catch (e: any) {
            console.error(e);
            throw e;
        }
    }
}