import { AzureDevOpsHelper } from "../AzureDevOpsHelper";
import { GraphMember       } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Helper            } from "../Helper";
import { readFile          } from "fs/promises";

export class devops_memberships_apply {
    static async handle(tenantId: string, organization: string, path: string): Promise<void> {
        const startDate = new Date();
        
        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

        const content = await readFile(path);
        const collection: { container: string, member: string }[] = JSON.parse(content.toString());
        collection.sort((a, b) => `${a.container}-${a.member}`.toLowerCase().localeCompare(`${b.container}-${b.member}`.toLowerCase()))

        const principalNames = [...new Set(collection.map(p => [p.container.toLowerCase(), p.member.toLowerCase()]).flat())];

        const graphMembers = await this.getGraphMembers(azureDevOpsHelper, organization, principalNames, 10);

        const memberPrincipalNamesAndContainerDescriptors = this.memberPrincipalNamesAndContainerDescriptors(collection, graphMembers);

        const newAssignmentsResolved = Array<{ container : string, member  : string }>();
        const graphMembersArray = Helper.toArray(graphMembers);

        for (const memberPrincipalName in memberPrincipalNamesAndContainerDescriptors) {
            const memberDescriptor = graphMembers[memberPrincipalName]?.descriptor;

            if (memberDescriptor === undefined) {
                throw new Error(JSON.stringify({ tenantId, organization, path, message: `Failed to resolve '${memberPrincipalName}' details in '${organization}'.` }))
            }

            const graphMemberships = await azureDevOpsHelper.graphMembershipsLists([{ organization, subjectDescriptor: memberDescriptor, direction: 'up' }]);
            const expectedContainerDescriptors = memberPrincipalNamesAndContainerDescriptors[memberPrincipalName];
            const actualContainerDescriptors   = graphMemberships.map(p => p.result).flat().map(p => p.containerDescriptor).filter(p => p !== undefined).map(p => p!);

            const { itemsInAandNotInB: containerDescriptorsAdd, itemsInBandNotInA: containerDescriptorsRemove } = Helper.getMissingElements(expectedContainerDescriptors, actualContainerDescriptors, (a, b) => a === b);

            const newGraphMemberships = await azureDevOpsHelper.graphMembershipsAdd(containerDescriptorsAdd.map(containerDescriptor => { return { organization, subjectDescriptor: memberDescriptor, containerDescriptor } }));

            newAssignmentsResolved.push(...newGraphMemberships.map(p => { return {
                container: graphMembersArray.find(m => m.descriptor?.toLowerCase() === p.result.containerDescriptor?.toLowerCase())?.principalName ?? '',
                member   : graphMembersArray.find(m => m.descriptor?.toLowerCase() === p.result.memberDescriptor   ?.toLowerCase())?.principalName ?? ''
            }}));
        }

        newAssignmentsResolved.sort((a, b) => `${a.container.toLowerCase()}-${a.member.toLowerCase()}`.localeCompare(`${b.container.toLowerCase()}-${b.member.toLowerCase()}`));

        console.log(JSON.stringify({
            parameters: {
                tenantId,
                organization,
                path
            },
            durationInSeconds: Helper.durationInSeconds(startDate),
            newAssignments: newAssignmentsResolved
        }, null, 2));
    }

    static memberPrincipalNamesAndContainerDescriptors(collection: { container: string, member: string }[], graphMembers: { [principalNameLowerCase: string]: GraphMember }) {
        const memberPrincipalNamesAndContainerDescriptors: { [id: string]: string[]; } = {};

        for (const member of [...new Set(collection.map(p => p.member.toLowerCase()))]) {
            memberPrincipalNamesAndContainerDescriptors[member]
                = collection
                    .filter(p => p.member.toLowerCase() === member.toLowerCase())
                    .map(p => p.container.toLowerCase())
                    .map(p => graphMembers[p]?.descriptor)
                    .filter(p => p !== undefined)
                    .map(p => p!);
        }

        return memberPrincipalNamesAndContainerDescriptors;
    }

    static async getGraphMembers(azureDevOpsHelper: AzureDevOpsHelper, organization: string, principalNames: string[], batchSize: number): Promise<{ [principalNameLowerCase: string]: GraphMember }> {
        const batchedPrincipalNames = Helper.getBatches(principalNames, batchSize);

        const graphMembers: { [principalNameLowerCase: string]: GraphMember } = {};

        for (const batch of batchedPrincipalNames) {
            const batchCollection = batch.map(principalName => { return {
                principalName,
                promise: azureDevOpsHelper.graphMemberByPrincipalName(organization, ['User', 'Group'], principalName)
            }});

            for (const item of batchCollection) {
                const graphMember = await item.promise;

                if (graphMember?.descriptor === undefined) {
                    throw new Error(JSON.stringify({ message: `Failed to resolve '${item.principalName}' in '${organization}'.` }))
                }

                graphMembers[item.principalName] = graphMember;
            }
        }

        return graphMembers;
    }
}
