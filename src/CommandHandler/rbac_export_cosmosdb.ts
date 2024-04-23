// import { AzureRoleAssignmentHelper            } from "../models/AzureRoleAssignment";
// import { AzureRoleAssignmentsConverter        } from "../AzureRoleAssignmentsConverter";
// import { AzureRoleAssignmentsToHtml           } from "../Converters/AzureRoleAssignmentsToHtml";
// import { AzureRoleAssignmentsToMarkdown       } from "../Converters/AzureRoleAssignmentsToMarkdown";
import { Helper                               } from "../Helper";
import { TokenCredential                      } from "@azure/identity";
import { writeFile                            } from "fs/promises";
import { AzureRoleAssignmentsResolverCosmosDb } from "../AzureRoleAssignmentsResolverCosmosDb";
import { AzureRoleAssignmentCosmosDbHelper    } from "../models/AzureRoleAssignmentCosmosDb";
import { AzureRoleAssignmentsCosmosDbConverter } from "../AzureRoleAssignmentsCosmosDbConverter";
import { AzureRoleAssignmentsCosmosDbToMarkdown } from "../Converters/AzureRoleAssignmentsCosmosDbToMarkdown";
import { AzureRoleAssignmentsCosmosDbToHtml } from "../Converters/AzureRoleAssignmentsCosmosDbToHtml";

export class rbac_export_cosmosdb {
    static async handle(credentials: TokenCredential, subscriptionId: string, path: string) : Promise<void> {
        const startDate = new Date();

        const result = await new AzureRoleAssignmentsResolverCosmosDb().resolve(credentials, subscriptionId);
        result.roleAssignments.sort(AzureRoleAssignmentCosmosDbHelper.sort);

        await Promise.all([
            writeFile(`${path}-${subscriptionId}.full.json` , JSON.stringify(result                                                                     , null, 2)),
            writeFile(`${path}-${subscriptionId}.min.json`  , JSON.stringify(new AzureRoleAssignmentsCosmosDbConverter().mapMinimal     (result.roleAssignments), null, 2)),
            writeFile(`${path}-${subscriptionId}.ext.json`  , JSON.stringify(new AzureRoleAssignmentsCosmosDbConverter().mapExtendend   (result.roleAssignments), null, 2)),
            writeFile(`${path}-${subscriptionId}.names.json`, JSON.stringify(new AzureRoleAssignmentsCosmosDbConverter().mapMinimalNoIds(result.roleAssignments), null, 2)),
            writeFile(`${path}-${subscriptionId}.md`        , new AzureRoleAssignmentsCosmosDbToMarkdown().convert(result.roleAssignments)),
            writeFile(`${path}-${subscriptionId}.html`      , new AzureRoleAssignmentsCosmosDbToHtml    ().convert(result.roleAssignments)),
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