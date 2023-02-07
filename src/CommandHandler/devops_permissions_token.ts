import { AzureDevOpsHelper         } from "../AzureDevOpsHelper";
import { AzureDevOpsSecurityTokens } from "../AzureDevOpsSecurityTokens";

export class devops_permissions_token {
    static async iteration(organization: string, projectName: string, teamName: string, iterationName: string | undefined): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = new AzureDevOpsHelper();
        const response = await AzureDevOpsSecurityTokens.Iteration(azureDevOpsHelper, organization, projectName, teamName, iterationName);

        if (response.error !== undefined) {
            throw response.error;
        }
        else if (response.value === undefined) {
            throw new Error(`Failed to resolve token for Iteration for '${JSON.stringify({ organization, teamName, iterationName })}'.`);
        }
        else {
            console.log({
                parameters: {
                    organization,
                    teamName
                },
                token: `${response.value}`,
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
            });
        }
    }
}
