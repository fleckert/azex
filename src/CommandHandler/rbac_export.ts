import { AzureRoleAssignmentHelper      } from "../models/AzureRoleAssignment";
import { AzureRoleAssignmentsConverter  } from "../AzureRoleAssignmentsConverter";
import { AzureRoleAssignmentsResolver   } from "../AzureRoleAssignmentsResolver";
import { AzureRoleAssignmentsToHtml     } from "../Converters/AzureRoleAssignmentsToHtml";
import { AzureRoleAssignmentsToMarkdown } from "../Converters/AzureRoleAssignmentsToMarkdown";
import { Helper                         } from "../Helper";
import { TokenCredential                } from "@azure/identity";
import { writeFile                      } from "fs/promises";

export class rbac_export {
    static async handle(credentials: TokenCredential, subscriptionId: string, path: string) : Promise<void> {
        const startDate = new Date();

        const result = await new AzureRoleAssignmentsResolver().resolve(credentials, subscriptionId);
        result.roleAssignments.sort(AzureRoleAssignmentHelper.sort);

        const scopes = result.roleAssignments.map(p=>p.roleAssignment.scope);
        scopes.sort();
        console.log(scopes);
        await writeFile('test.txt', scopes.join('\n'));

        await Promise.all([
            writeFile(`${path}-${subscriptionId}.full.json` , JSON.stringify(result                                                                     , null, 2)),
            writeFile(`${path}-${subscriptionId}.min.json`  , JSON.stringify(new AzureRoleAssignmentsConverter().mapMinimal     (result.roleAssignments), null, 2)),
            writeFile(`${path}-${subscriptionId}.ext.json`  , JSON.stringify(new AzureRoleAssignmentsConverter().mapExtendend   (result.roleAssignments), null, 2)),
            writeFile(`${path}-${subscriptionId}.names.json`, JSON.stringify(new AzureRoleAssignmentsConverter().mapMinimalNoIds(result.roleAssignments), null, 2)),
            writeFile(`${path}-${subscriptionId}.md`        , new AzureRoleAssignmentsToMarkdown().convert(result.roleAssignments)),
            writeFile(`${path}-${subscriptionId}.html`      , new AzureRoleAssignmentsToHtml    ().convert(result.roleAssignments)),
        ]);

        console.log(JSON.stringify({
            parameters: {
                subscriptionId,
                path
            },
            durationInSeconds: Helper.durationInSeconds(startDate),
            files: {
                json: {
                    full : `${path}-${subscriptionId}.full.json`,
                    min  : `${path}-${subscriptionId}.min.json`,
                    ext  : `${path}-${subscriptionId}.ext.json`,
                    names: `${path}-${subscriptionId}.names.json`,
                },
                markdown  : `${path}-${subscriptionId}.md`,
                html      : `${path}-${subscriptionId}.html`,
            },
            failedRequests: result.failedRequests,
        }, null, 2));
    }
}