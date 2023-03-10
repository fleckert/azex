import { AzureDevOpsHelper } from "../AzureDevOpsHelper";
import { Helper            } from "../Helper";

export class devops_invite_user {
    static async handle(tenantId: string, organization: string, principalName: string, accessLevel: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

        const graphSubject = await azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, ['User'], principalName);

        if (graphSubject === undefined) {
            const response = await azureDevOpsHelper.inviteUser(organization, principalName, accessLevel);

            console.log(JSON.stringify({
                parameters: {
                    organization,
                    principalName,
                    accessLevel
                },
                response,
                durationInSeconds: Helper.durationInSeconds(startDate)
            }, null, 2));
        }
        else if (graphSubject.descriptor !== undefined) {
            const userEntitlements = await azureDevOpsHelper.userEntitlements(organization, graphSubject?.descriptor);

            console.log(JSON.stringify({
                parameters: {
                    organization,
                    principalName,
                    accessLevel
                },
                userEntitlements,
                durationInSeconds: Helper.durationInSeconds(startDate)
            }, null, 2));
        }
        else {
            throw new Error(`Failed to resolve '${principalName}' in '${organization}'`);
        }
    }
}
