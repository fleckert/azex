import { CommandRunner } from "./CommandRunner";

export class AzureDevOpsPat {
    static async getPersonalAccessToken(tenantId: string | undefined): Promise<string> {
        // https://learn.microsoft.com/en-us/azure/devops/cli/log-in-via-pat
        const token = process.env.AZURE_DEVOPS_EXT_PAT;
        if (token !== undefined && token.trim() !== '') {
            return token;
        }

        // https://www.dylanberry.com/2021/02/21/how-to-get-a-pat-personal-access-token-for-azure-devops-from-the-az-cli/
        const command = `az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken --output tsv ${`${tenantId}`.trim() === '' ? '' : `--tenant ${tenantId}`}`

        const { stdout, stderr } = await CommandRunner.runAndMap(command, stdOut => stdOut?.trim(), stdErr => stdErr?.trim());

        if (stdout !== undefined && stderr?.length === 0) {
            return stdout;
        }

        throw new Error('Failed to resolve accessToken');
    }
}
