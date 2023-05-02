import { AzureDevOpsHelper        } from "./AzureDevOpsHelper";
import { AzureDevOpsItemAndOthers } from "./models/AzureDevOpsItemAndOthers";
import { GraphMember              } from "azure-devops-node-api/interfaces/GraphInterfaces";

export class AzureDevOpsMembershipsResolver {
    resolve(
        azureDevOpsHelper: AzureDevOpsHelper,
        organization     : string,
        subjectDescriptor: string,
        direction        : 'up' | 'down',
    ): Promise<AzureDevOpsItemAndOthers> {
        return direction === 'up'
            ? this.resolveInternalUp  (azureDevOpsHelper, organization, subjectDescriptor, {})
            : this.resolveInternalDown(azureDevOpsHelper, organization, subjectDescriptor, {});
    }

    private async resolveInternalUp(azureDevOpsHelper: AzureDevOpsHelper, organization: string, subjectDescriptor: string, cache: { [id: string]: GraphMember }): Promise<AzureDevOpsItemAndOthers> {
        // cache aside... to reduce resolving the same subjectDescriptor again and again
        // example: user is part of multiple groups
        cache[subjectDescriptor] = cache[subjectDescriptor] ?? await azureDevOpsHelper.graphSubjectLookup(organization, subjectDescriptor);

        const graphSubject = cache[subjectDescriptor];

        if (graphSubject === undefined) {
            throw new Error(JSON.stringify({ organization, subjectDescriptor, message: 'Failed to resolve graphSubject.' }));
        }

        const itemAndOthers = new AzureDevOpsItemAndOthers(graphSubject as GraphMember, new Array<AzureDevOpsItemAndOthers>() );

        const graphMembershipLists = await azureDevOpsHelper.graphMembershipsLists([{ organization, subjectDescriptor, direction: 'up' }]);

        const containerDescriptors = graphMembershipLists.map(p => p.result).flat().filter(p=>p.containerDescriptor !== undefined).map(p=>p.containerDescriptor!);

        // // this is starting unbounded parallel execution
        // const collection = await Promise.all(
        //     containerDescriptors.map(containerDescriptor => this.resolveInternalUp(azureDevOpsHelper, organization, containerDescriptor, cache))
        // );

        // itemAndOthers.others.push(...collection);

        for (const containerDescriptor of containerDescriptors) {

            const itemAndOthersInternal = await this.resolveInternalUp(azureDevOpsHelper, organization, containerDescriptor, cache);

            itemAndOthers.others.push(itemAndOthersInternal);
        }

        return itemAndOthers;
    }

    private async resolveInternalDown(azureDevOpsHelper: AzureDevOpsHelper, organization: string, subjectDescriptor: string, cache: { [id: string]: GraphMember }): Promise<AzureDevOpsItemAndOthers> {
        // cache aside... to reduce resolving the same subjectDescriptor again and again
        // example: user is part of multiple groups
        cache[subjectDescriptor] = cache[subjectDescriptor] ?? await azureDevOpsHelper.graphSubjectLookup(organization, subjectDescriptor);

        const graphSubject = cache[subjectDescriptor];

        if (graphSubject === undefined) {
            throw new Error(JSON.stringify({ organization, subjectDescriptor, message: 'Failed to resolve graphSubject.' }));
        }

        const itemAndOthers = new AzureDevOpsItemAndOthers(graphSubject as GraphMember, new Array<AzureDevOpsItemAndOthers>());

        const graphMembershipLists = await azureDevOpsHelper.graphMembershipsLists([{ organization, subjectDescriptor, direction: 'down' }]);

        const memberDescriptors = graphMembershipLists.map(p => p.result).flat().filter(p => p.memberDescriptor !== undefined).map(p => p.memberDescriptor!);

        // // this is starting unbounded parallel execution
        // const collection = await Promise.all(
        //     memberDescriptors.map(memberDescriptor => this.resolveInternalDown(azureDevOpsHelper, organization, memberDescriptor, cache))
        // );

        // itemAndOthers.others.push(...collection);

        for (const memberDescriptor of memberDescriptors) {
            const itemAndOthersInternal = await this.resolveInternalDown(azureDevOpsHelper, organization, memberDescriptor, cache);

            itemAndOthers.others.push(itemAndOthersInternal);
        }

        return itemAndOthers;
    }
}
