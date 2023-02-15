import { AzureRoleAssignmentsConverter  } from "../AzureRoleAssignmentsConverter";
import { AzureRoleAssignmentsResolver   } from "../AzureRoleAssignmentsResolver";
import { AzureRoleAssignmentsToMarkdown } from "../Converters/AzureRoleAssignmentsToMarkdown";
import { TokenCredential                } from "@azure/identity";
import { writeFile                      } from "fs/promises";
import { AzureRoleAssignmentsToHtml     } from "../Converters/AzureRoleAssignmentsToHtml";
import { AzureRoleAssignmentHelper      } from "../models/AzureRoleAssignment";

export class rbac_export {
    static async handle(credentials: TokenCredential, subscriptionId: string, path: string) : Promise<void> {
        const startDate = new Date();

        try {
            const result = await new AzureRoleAssignmentsResolver().resolve(credentials, subscriptionId);
            result.roleAssignments.sort(AzureRoleAssignmentHelper.sort);

            await Promise.all([
                writeFile(`${path}-${subscriptionId}.full.json` , JSON.stringify(result                                                                     , null, 2)),
                writeFile(`${path}-${subscriptionId}.min.json`  , JSON.stringify(new AzureRoleAssignmentsConverter().mapMinimal     (result.roleAssignments), null, 2)),
                writeFile(`${path}-${subscriptionId}.ext.json`  , JSON.stringify(new AzureRoleAssignmentsConverter().mapExtendend   (result.roleAssignments), null, 2)),
                writeFile(`${path}-${subscriptionId}.names.json`, JSON.stringify(new AzureRoleAssignmentsConverter().mapMinimalNoIds(result.roleAssignments), null, 2)),
                writeFile(`${path}-${subscriptionId}.md`        , new AzureRoleAssignmentsToMarkdown().convert(result.roleAssignments)),
                writeFile(`${path}-${subscriptionId}.html`      , new AzureRoleAssignmentsToHtml    ().convert(result.roleAssignments)),
            ]);

            console.log({
                parameters: {
                    subscriptionId,
                    path
                },
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000,
                files: {
                    json_full : `${path}-${subscriptionId}.full.json`,
                    json_min  : `${path}-${subscriptionId}.min.json`,
                    json_ext  : `${path}-${subscriptionId}.ext.json`,
                    json_names: `${path}-${subscriptionId}.names.json`,
                    markdown  : `${path}-${subscriptionId}.md`,
                    html      : `${path}-${subscriptionId}.html`,
                },
                failedRequests: result.failedRequests,
            });
        } catch (e:any) {
            console.error(e);
            throw e;
        }
    }
}