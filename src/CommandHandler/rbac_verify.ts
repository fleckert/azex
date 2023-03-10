import { AzureRoleAssignmentHelper      } from "../models/AzureRoleAssignment";
import { AzureRoleAssignmentsConverter  } from "../AzureRoleAssignmentsConverter";
import { AzureRoleAssignmentsToHtml     } from "../Converters/AzureRoleAssignmentsToHtml";
import { AzureRoleAssignmentsToMarkdown } from "../Converters/AzureRoleAssignmentsToMarkdown";
import { AzureRoleAssignmentsVerifier   } from "../AzureRoleAssignmentsVerifier";
import { Helper                         } from "../Helper";
import { RbacDefinition                 } from "../models/RbacDefinition";
import { readFile, writeFile            } from "fs/promises";
import { TokenCredential                } from "@azure/identity";

export class rbac_verify {
    static async handle(credentials: TokenCredential, subscriptionId: string, pathIn: string, pathOut: string) : Promise<void> {
        const startDate = new Date();

        const content = await readFile(pathIn);
        const rbacDefinitions = JSON.parse(content.toString()) as RbacDefinition[];
        const rbacDefinitionsVerified = await new AzureRoleAssignmentsVerifier().verify(credentials, subscriptionId, rbacDefinitions);
        rbacDefinitionsVerified.items.sort(AzureRoleAssignmentHelper.sort);
    
        await Promise.all([
            writeFile(`${pathOut}-${subscriptionId}.full.json`, JSON.stringify(rbacDefinitionsVerified.items, null, 2)),
            writeFile(`${pathOut}-${subscriptionId}.min.json` , JSON.stringify(new AzureRoleAssignmentsConverter().mapMinimalEx  (rbacDefinitionsVerified.items), null, 2)),
            writeFile(`${pathOut}-${subscriptionId}.ext.json` , JSON.stringify(new AzureRoleAssignmentsConverter().mapExtendendEx(rbacDefinitionsVerified.items), null, 2)),
            writeFile(`${pathOut}-${subscriptionId}.md`       , new AzureRoleAssignmentsToMarkdown().convertEx(rbacDefinitionsVerified.items)),
            writeFile(`${pathOut}-${subscriptionId}.html`     , new AzureRoleAssignmentsToHtml    ().convertEx(rbacDefinitionsVerified.items))
        ]);

        console.log(JSON.stringify({
            parameters: {
                subscriptionId,
                pathIn,
                pathOut
            },
            durationInSeconds: Helper.durationInSeconds(startDate),
            files: {
                json: {
                    full: `${pathOut}-${subscriptionId}.full.json`,
                    min : `${pathOut}-${subscriptionId}.min.json`,
                    ext : `${pathOut}-${subscriptionId}.ext.json`
                },
                markdown: `${pathOut}-${subscriptionId}.md`,
                html: `${pathOut}-${subscriptionId}.html`
            },
            failedRequests: rbacDefinitionsVerified.failedRequests,
        }, null, 2));
    }
}
