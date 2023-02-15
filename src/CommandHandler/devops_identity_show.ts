import { AzureDevOpsHelper } from "../AzureDevOpsHelper";

export class devops_identity_show {
    static async resolve(tenantId: string, organization: string, principalName: string, subjectKind:['User'] | ['Group'] | ['User', 'Group']): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = new AzureDevOpsHelper(tenantId);

        const result = await azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, subjectKind, principalName);
        if (result?.descriptor === undefined) {
            throw new Error(`Failed to resolve subject ${JSON.stringify({ organization, principalName })}.`);
        }
        else {
            const subjectDescriptor = result.descriptor;

            const identity = await azureDevOpsHelper.identityBySubjectDescriptor(organization, subjectDescriptor);
            if (identity?.descriptor === undefined) {
                throw new Error(`Failed to resolve identity descriptor ${JSON.stringify({ organization, principalName, subjectDescriptor })}.`);
            }
            else {
                console.log({
                    parameters: {
                        organization,
                        principalName
                    },
                    identity: identity.descriptor,
                    durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
                });
            }
        }
    }
}
