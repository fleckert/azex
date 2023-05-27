import { AzureDevOpsHelper } from "../AzureDevOpsHelper";
import { GraphGroup        } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Helper            } from "../Helper";

export class devops_memberships_clear {
    static async handle(tenant: string, organization: string, principalName: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

        const graphSubject = await azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, ['User', 'Group'], principalName);

        if (graphSubject?.descriptor === undefined) { throw new Error(`Failed to resolve graphSubject.descriptor for ${JSON.stringify({ organization, principalName, graphSubject })}.`); }

        const containerDescriptors = (await azureDevOpsHelper.graphMembershipsLists([{ organization, subjectDescriptor: graphSubject.descriptor, direction: 'up' }])).map(p => p.result).flat().filter(p => p.containerDescriptor !== undefined).map(p => p.containerDescriptor!);

        const groups = await azureDevOpsHelper.graphSubjectsLookup(organization, containerDescriptors);

        const groupsPrincipalNames = Helper.toArray(groups).map(p => p as GraphGroup).map(p => p.principalName).filter(p => p !== undefined).map(p => p!).sort();

        await azureDevOpsHelper.graphMembershipsRemove(containerDescriptors.map(containerDescriptor => { return { organization, subjectDescriptor: graphSubject.descriptor!, containerDescriptor } }));

        console.log(JSON.stringify({
            parameters: {
                tenant,
                organization,
                principalName
            },
            durationInSeconds: Helper.durationInSeconds(startDate),
            groupsRemoved: groupsPrincipalNames
        }, null, 2));
    }
}
