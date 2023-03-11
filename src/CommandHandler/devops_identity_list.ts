import { AzureDevOpsHelper } from "../AzureDevOpsHelper";
import { GraphMember       } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Helper            } from "../Helper";
import { Html              } from "../Converters/Html";
import { Identity          } from "azure-devops-node-api/interfaces/IdentitiesInterfaces";
import { Markdown          } from "../Converters/Markdown";
import { writeFile         } from "fs/promises";

export class devops_identity_list {
    static async resolve(tenantId: string, organization: string, project: string | undefined, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

        const groupsPromise = project === undefined ? azureDevOpsHelper.graphGroupsList(organization) : azureDevOpsHelper.graphGroupsListForProjectName(organization, project);
        const usersPromise  = project === undefined ? azureDevOpsHelper.graphUsersList (organization) : azureDevOpsHelper.graphUsersListForProjectName (organization, project);

        const graphMembers = [...await groupsPromise, ...await usersPromise];

        const subjectDescriptors = graphMembers.filter(p => p.descriptor !== undefined).map(p => p.descriptor!);

        const identities = await azureDevOpsHelper.identitiesBySubjectDescriptors(organization, subjectDescriptors);

        const collection = new Array<{ graphMember: GraphMember, identity: Identity | undefined }>();

        for (const graphMember of graphMembers) {
            collection.push({
                graphMember,
                identity: identities.find(p => p.subjectDescriptor === graphMember.descriptor)
            });
        }

        collection.sort((a:{ graphMember: GraphMember, identity: Identity | undefined },b:{ graphMember: GraphMember, identity: Identity | undefined })=>{
            const map = (item: { graphMember: GraphMember }) => {
                if (AzureDevOpsHelper.isGraphGroup(item.graphMember)) {
                    return `${item.graphMember.principalName}`.toLowerCase()
                }

                return `${item.graphMember.displayName}`.toLowerCase()
            };

            return map(a).localeCompare(map(b));
        });

        const collectionMapped = collection.map(p => {
            return {
                graphMemberDisplayName  : `${p.graphMember.displayName  }`,
                graphMemberPrincipalName: `${p.graphMember.principalName}`,
                graphMemberSubjectKind  : `${p.graphMember.subjectKind}`,
                graphMemberDescriptor   : `${p.graphMember.descriptor   }`,
                identityDescriptor      : `${p.identity?.descriptor     }`,
            }
        });

        const title = `${organization}${project === undefined ? '' : `-${project}`}-identities`.replaceAll(' ', '_');
        const valuesMapped = collectionMapped.map(p => [
            `${p.graphMemberSubjectKind}`.toLowerCase() === 'group' 
            ? `${p.graphMemberPrincipalName}` 
            : `${p.graphMemberDisplayName}`,
            p.identityDescriptor]);

        await Promise.all([
            writeFile(`${path}-${title}.json`, JSON.stringify(collectionMapped, null, 2)),
            writeFile(`${path}-${title}.md`  , Markdown.table(title, ['PrincipalName', 'Identity'], valuesMapped)),
            writeFile(`${path}-${title}.html`, Html    .table(title, ['PrincipalName', 'Identity'], valuesMapped))
        ]);

        console.log(JSON.stringify({
            tenantId,
            organization,
            project,
            files: {
                json    : `${path}-${title}.json`,
                markdown: `${path}-${title}.md`,
                html    : `${path}-${title}.html`
            },
            durationInSeconds: Helper.durationInSeconds(startDate)
        }, null, 2));
    }
}
