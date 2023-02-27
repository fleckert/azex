import { AzureDevOpsHelper } from "../AzureDevOpsHelper";
import { GraphMember       } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Html              } from "../Converters/Html";
import { Identity          } from "azure-devops-node-api/interfaces/IdentitiesInterfaces";
import { Markdown          } from "../Converters/Markdown";
import { writeFile         } from "fs/promises";

export class devops_identity_list {
    static async resolve(tenantId: string, organization: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

        const groupsPromise =  azureDevOpsHelper.graphGroupsList(organization);
        const usersPromise  =  azureDevOpsHelper.graphUsersList (organization);

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
            const map = (item: { graphMember: GraphMember }) => `${item.graphMember.principalName}`.toLowerCase();

            return map(a).localeCompare(map(b));
        });

        const collectionMapped = collection.map(p => {
            return {
                graphMemberPrincipalName: `${p.graphMember.principalName}`,
                graphMemberDescriptor   : `${p.graphMember.descriptor   }`,
                identityDescriptor      : `${p.identity?.descriptor     }`,
            }
        });

        const title = `${organization}-identities`;
        const valuesMapped = collectionMapped.map(p => [p.graphMemberPrincipalName, p.identityDescriptor]);

        await Promise.all([
            writeFile(`${path}-${title}.json`, JSON.stringify(collectionMapped, null, 2)),
            writeFile(`${path}-${title}.md`  , Markdown.table(title, ['PrincipalName', 'Identity'], valuesMapped)),
            writeFile(`${path}-${title}.html`, Html    .table(title, ['PrincipalName', 'Identity'], valuesMapped))
        ]);

        console.log({
            parameters: {
                tenantId,
                organization,
                path
            },
            files: {
                json    : `${path}-${title}.json`,
                markdown: `${path}-${title}.md`,
                html    : `${path}-${title}.html`
            },
            durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
        });
    }
}
