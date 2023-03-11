import { AzureDevOpsHelper } from "../AzureDevOpsHelper";
import { Helper            } from "../Helper";

export class devops_identity_show {
    static async resolve(tenantId: string, organization: string, principalName: string, subjectKind: ['User'] | ['Group'] | ['User', 'Group']): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

        const graphSubject = await azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, subjectKind, principalName);
        if (graphSubject?.descriptor === undefined) {
            throw new Error(JSON.stringify({ organization, principalName, graphSubject, error: 'Failed to resolve graphSubject.descriptor.' }));
        }

        const identity = await azureDevOpsHelper.identityBySubjectDescriptor(organization, graphSubject.descriptor);
        if (identity?.descriptor === undefined) {
            throw new Error(JSON.stringify({ organization, principalName,  graphSubject, identity, error: 'Failed to resolve identity.descriptor.' }));
        }

        console.log(JSON.stringify({
            tenantId,
            organization,
            principalName,
            subjectDescriptor : graphSubject.descriptor,
            identityDescriptor: identity.descriptor,
            durationInSeconds : Helper.durationInSeconds(startDate)
        }, null, 2));
    }
}
