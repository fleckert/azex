import { AzureDevOpsHelper } from "../AzureDevOpsHelper";

export class devops_identity_show {
    static async resolve(organization: string, principalName: string, subjectKind:['User'] | ['Group'] | ['User', 'Group']): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = new AzureDevOpsHelper();

        const result = await azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, subjectKind, principalName);
        if (result.error !== undefined) {
            throw new Error(`Failed to resolve subject ${JSON.stringify({ organization, principalName })}. [${result.error}]`);
        }
        else if (result.value === undefined) {
            throw new Error(`Failed to resolve subject ${JSON.stringify({ organization, principalName })}.`);
        }
        else if (result.value.descriptor === undefined) {
            throw new Error(`Failed to resolve subject ${JSON.stringify({ organization, principalName })}.`);
        }
        else {
            const subjectDescriptor = result.value.descriptor;

            const identity = await azureDevOpsHelper.identityBySubjectDescriptor(organization, subjectDescriptor);
            if (identity.error !== undefined) {
                throw new Error(`Failed to resolve identity ${JSON.stringify({ organization, principalName, subjectDescriptor, subject: result.value })}. [${result.error}]`);
            }
            else if (identity.value === undefined) {
                throw new Error(`Failed to resolve identity ${JSON.stringify({ organization, principalName, subjectDescriptor })}.`);
            }
            else {
                console.log({
                    parameters: {
                        organization,
                        principalName
                    },
                    identity: identity.value.descriptor,
                    durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
                });
            }
        }
    }
}
