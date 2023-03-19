import { AzureDevOpsHelper      } from "../AzureDevOpsHelper";
import { AzureDevOpsPortalLinks } from "../AzureDevOpsPortalLinks";
import { GraphGroup             } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Helper                 } from "../Helper";

export class devops_memberships_copy {
    static async handle(tenant: string, organization: string, principalNameSource: string, principalNameTarget: string, add: boolean, remove: boolean): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

        const graphSubjectSourcePromise = azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, ['User', 'Group'], principalNameSource);
        const graphSubjectTargetPromise = azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, ['User', 'Group'], principalNameTarget);

        const graphSubjectSource = await graphSubjectSourcePromise;
        const graphSubjectTarget = await graphSubjectTargetPromise;

        if (graphSubjectSource?.descriptor === undefined) { throw new Error(`Failed to resolve graphSubject.descriptor for ${JSON.stringify({ organization, principalNameSource, graphSubjectSource })}.`); }
        if (graphSubjectTarget?.descriptor === undefined) { throw new Error(`Failed to resolve graphSubject.descriptor for ${JSON.stringify({ organization, principalNameTarget, graphSubjectTarget })}.`); }

        const containerDescriptorsSource = (await azureDevOpsHelper.graphMembershipsLists([{ organization, subjectDescriptor: graphSubjectSource.descriptor, direction: 'up' }])).map(p => p.result).flat().filter(p => p.containerDescriptor !== undefined).map(p => p.containerDescriptor!);
        const containerDescriptorsTarget = (await azureDevOpsHelper.graphMembershipsLists([{ organization, subjectDescriptor: graphSubjectTarget.descriptor, direction: 'up' }])).map(p => p.result).flat().filter(p => p.containerDescriptor !== undefined).map(p => p.containerDescriptor!);

        const { itemsInAandNotInB: containerDescriptorsAdd, itemsInBandNotInA: containerDescriptorsRemove } = Helper.getMissingElements(containerDescriptorsSource, containerDescriptorsTarget, (a: string, b: string) => a === b);

        const groups = await azureDevOpsHelper.graphSubjectsLookup(organization, [...containerDescriptorsAdd, ...containerDescriptorsRemove]);

        const groupsAdded   = Helper.getItemsFromMap<GraphGroup>(containerDescriptorsAdd   , groups, 'failForMissingId');
        const groupsRemoved = Helper.getItemsFromMap<GraphGroup>(containerDescriptorsRemove, groups, 'failForMissingId');

        groupsAdded  .sort((a: GraphGroup, b: GraphGroup) => `${a.principalName}`.localeCompare(`${b.principalName}`));
        groupsRemoved.sort((a: GraphGroup, b: GraphGroup) => `${a.principalName}`.localeCompare(`${b.principalName}`));

        if (add   ) { await azureDevOpsHelper.graphMembershipsAdd   (containerDescriptorsAdd   .map(containerDescriptor => { return { organization, subjectDescriptor: graphSubjectTarget.descriptor!, containerDescriptor } })); }
        if (remove) { await azureDevOpsHelper.graphMembershipsRemove(containerDescriptorsRemove.map(containerDescriptor => { return { organization, subjectDescriptor: graphSubjectTarget.descriptor!, containerDescriptor } })); }

        console.log(JSON.stringify({
            parameters: {
                tenant,
                organization,
                principalNameSource,
                principalNameTarget
            },
            durationInSeconds: Helper.durationInSeconds(startDate),
            links: {
                permissionsSource: AzureDevOpsPortalLinks.Permissions(organization, undefined, graphSubjectSource.descriptor),
                permissionsTarget: AzureDevOpsPortalLinks.Permissions(organization, undefined, graphSubjectTarget.descriptor)
            },
            groupsAdded  : groupsAdded  .map(p => { return { group: p.principalName, permissions: AzureDevOpsPortalLinks.Permissions(organization, undefined, p.descriptor) } }),
            groupsRemoved: groupsRemoved.map(p => { return { group: p.principalName, permissions: AzureDevOpsPortalLinks.Permissions(organization, undefined, p.descriptor) } }),
        }, null, 2));
    }
}
