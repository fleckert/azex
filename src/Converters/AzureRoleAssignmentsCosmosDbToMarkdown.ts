import { AzureResourceIdSlim                                        } from "../AzureResourceIdSlim";
import { Markdown                                                   } from "./Markdown";
import { AzureRoleAssignmentCosmosDb, AzureRoleAssignmentCosmosDbEx } from "../models/AzureRoleAssignmentCosmosDb";
import { SqlRoleAssignmentGetResults } from "@azure/arm-cosmosdb";

export class AzureRoleAssignmentsCosmosDbToMarkdown{

    convert(collection: Array<AzureRoleAssignmentCosmosDb>) : string {

        const lines = new Array<string>();

        lines.push("|Subscription|ResourceGroup|Resource |Role<br/>Principal|");
        lines.push("|-           |-            |-        |-                 |");

        for (const item of collection) {
            const tenantId                = item.tenantId;
            const subscriptionId          = item.subscriptionId;
            const subscriptionDisplayName = item.subscriptionName;
            const resourceId              = new AzureResourceIdSlim(`${item.roleAssignment.scope}`);

            lines.push(
                `|${Markdown.subscription            (tenantId, subscriptionId, subscriptionDisplayName)}` +
                `|${Markdown.resourceGroup           (tenantId, subscriptionId, resourceId.resourceGroupName)}` +
                `|${Markdown.cosmosDb                (tenantId, subscriptionId, item.resourceGroupName, item.accountName, resourceId.resource ?? item.accountName)}` +
                `|${Markdown.roleDefinitionCosmosDb  (item)}` +
                `<br/>${Markdown.activeDirectoryPrincipal(item)}|`
            );
        }

        lines.push("\n");

        const sqlRoleAssignmentGetResults = new Map<string, SqlRoleAssignmentGetResults>();

        for (const item of collection) {
            if(item.roleDefinition.id !== undefined) {
                sqlRoleAssignmentGetResults.set(item.roleDefinition.id, item.roleDefinition);
            }
        }

        for(const sqlRoleAssignmentGetResult of sqlRoleAssignmentGetResults.values()){
            lines.push('');
            lines.push("<hr/>");
            lines.push('');
            lines.push('```JSON');
            lines.push(JSON.stringify(sqlRoleAssignmentGetResult, null, 2));
            lines.push('```');
        }

        return lines.join('\n');
    }
}
