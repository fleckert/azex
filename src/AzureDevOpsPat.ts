import { BearerToken } from "./BearerToken";

export class AzureDevOpsPat {
    static async getPersonalAccessToken(tenant: string | undefined): Promise<string> {
        // https://learn.microsoft.com/en-us/azure/devops/cli/log-in-via-pat
        const token = process.env.AZURE_DEVOPS_EXT_PAT;
        if (token !== undefined && token.trim() !== '') {
            return token;
        }

        return await BearerToken.azureDevOps(tenant);
    }
}
