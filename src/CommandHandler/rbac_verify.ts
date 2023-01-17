import { AzureRoleAssignmentsConverter  } from "../AzureRoleAssignmentsConverter";
import { AzureRoleAssignmentsToHtml     } from "../Converters/AzureRoleAssignmentsToHtml";
import { AzureRoleAssignmentsToMarkdown } from "../Converters/AzureRoleAssignmentsToMarkdown";
import { AzureRoleAssignmentsVerifier   } from "../AzureRoleAssignmentsVerifier";
import { RbacDefinition                 } from "../models/RbacDefinition";
import { readFile, writeFile            } from "fs/promises";
import { TokenCredential                } from "@azure/identity";
import { AzureRoleAssignmentHelper      } from "../models/AzureRoleAssignment";

export class rbac_verify {
    static async handle(credential: TokenCredential, subscriptionId: string, pathIn: string, pathOut: string) : Promise<void> {
        const startDate = new Date();

        try {
            const content = await readFile(pathIn);
            const rbacDefinitions = JSON.parse(content.toString()) as RbacDefinition[];
            const rbacDefinitionsVerified = await new AzureRoleAssignmentsVerifier().verify(credential, subscriptionId, rbacDefinitions);
            rbacDefinitionsVerified.items.sort(AzureRoleAssignmentHelper.sort);
        
            await Promise.all([
                writeFile(`${pathOut}-${subscriptionId}.full.json`, JSON.stringify(rbacDefinitionsVerified.items, null, 2)),
                writeFile(`${pathOut}-${subscriptionId}.min.json` , JSON.stringify(new AzureRoleAssignmentsConverter().mapMinimalEx  (rbacDefinitionsVerified.items), null, 2)),
                writeFile(`${pathOut}-${subscriptionId}.ext.json` , JSON.stringify(new AzureRoleAssignmentsConverter().mapExtendendEx(rbacDefinitionsVerified.items), null, 2)),
                writeFile(`${pathOut}-${subscriptionId}.md`       , new AzureRoleAssignmentsToMarkdown().convertEx(rbacDefinitionsVerified.items)),
                writeFile(`${pathOut}-${subscriptionId}.html`     , new AzureRoleAssignmentsToHtml    ().convertEx(rbacDefinitionsVerified.items))
            ]);

            console.log({
                parameters: {
                    subscriptionId,
                    pathIn,
                    pathOut
                },
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000,
                files: [
                    `${pathOut}-${subscriptionId}.full.json`,
                    `${pathOut}-${subscriptionId}.min.json`,
                    `${pathOut}-${subscriptionId}.ext.json`,
                    `${pathOut}-${subscriptionId}.md`,
                    `${pathOut}-${subscriptionId}.html`,
                ],
                failedRequests: rbacDefinitionsVerified.failedRequests,
            });
        } catch (e: any) {
            console.error(e);
            throw e;
        }
    }
}