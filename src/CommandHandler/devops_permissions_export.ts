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

                const mermaid = Markdown.getMermaidDiagramForHierarchy(
                    groupMembersFlat
                    .filter(p => `${p.container.principalName}`.indexOf('Project Valid Users') < 0)
                    .map(p => { return { container: p.container.principalName, member: p.member.principalName } })
                );
                await writeFile(`${path}-${organization}-${project}-groupMembers.md`, mermaid);

                const mermaidHtml = Html.getMermaidDiagramForHierarchy(
                    `${organization}-${project}`,
                    groupMembersFlat
                    .filter(p => `${p.container.principalName}`.indexOf('Project Valid Users') < 0)
                    .map(p => { return { container: p.container.principalName, member: p.member.principalName } })
                );
                await writeFile(`${path}-${organization}-${project}-groupMembers.html`, mermaidHtml);

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
                        `${path}-${organization}-${project}-groupMembers.md`,
                        `${path}-${organization}-${project}-groupMembers.html`
                    ]
                });
            }
        } catch (e: any) {
            console.error(e);
            throw e;
        }
    }

    private static getMemberIdentifier(graphSubject: GraphSubject): string | undefined {
        if (graphSubject.subjectKind === 'user' ) { return (graphSubject as GraphMember).principalName; }
        if (graphSubject.subjectKind === 'group') { return (graphSubject as GraphMember).principalName; }

        return graphSubject.originId;
    }
}