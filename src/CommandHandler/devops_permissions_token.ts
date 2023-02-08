import { AzureDevOpsHelper         } from "../AzureDevOpsHelper";
import { AzureDevOpsSecurityTokens } from "../AzureDevOpsSecurityTokens";
import { writeFile                 } from "fs/promises";

export class devops_permissions_token {
    static async classificationNodes(organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = new AzureDevOpsHelper();
        const response = await AzureDevOpsSecurityTokens.classificationNodes(azureDevOpsHelper, organization, project);

        if (response.error !== undefined) {
            throw new Error(`Failed to resolve classificationNodes ${JSON.stringify({ organization, project })}. [${response.error}]`);
        }
        else if (response.value === undefined) {
            throw new Error(`Failed to resolve classificationNodes ${JSON.stringify({ organization, project })}.`);
        }
        else {
            const title = `${organization}-${project}-classificationNodes`;

            await Promise.all([
                writeFile(`${path}-${title}.json`, JSON.stringify(response.value, null, 2))
            ]);

            console.log({
                parameters: {
                    organization,
                    project,
                    path
                },
                files: [
                    `${path}-${title}.json`
                ],
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
            });
        }
    }
}
