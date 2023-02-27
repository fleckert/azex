import { AzureDevOpsHelper } from "../AzureDevOpsHelper";

export class devops_identity_show {
    static async resolve(tenantId: string, organization: string, principalName: string, subjectKind: ['User'] | ['Group'] | ['User', 'Group']): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

        const result = await azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, subjectKind, principalName);
        if (result?.descriptor === undefined) {
            throw new Error(JSON.stringify({ organization, principalName, error: 'Failed to resolve subject.' }));
        }

        const subjectDescriptor = result.descriptor;

        const identity = await azureDevOpsHelper.identityBySubjectDescriptor(organization, subjectDescriptor);
        if (identity?.descriptor === undefined) {
            throw new Error(JSON.stringify({ organization, principalName, subjectDescriptor, error: 'Failed to resolve identity.' }));
        }

        console.log({
            parameters: {
                tenantId,
                organization,
                principalName,
                subjectKind
            },
            identity: identity.descriptor,
            durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
        });

    }
}
