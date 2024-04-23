import { AzureResourceId                                            } from "../AzureResourceId";
import { Markdown                                                   } from "./Markdown";
import { AzureRoleAssignmentCosmosDb, AzureRoleAssignmentCosmosDbEx } from "../models/AzureRoleAssignmentCosmosDb";

export class AzureRoleAssignmentsCosmosDbToMarkdown{

    convert(collection: Array<AzureRoleAssignmentCosmosDb>) : string {

        const lines = new Array<string>();

        lines.push("|Subscription|ResourceGroup|AccountName|ResourceType|ResourceName|Role|Principal|");
        lines.push("|-           |-            |-          |-           |-           |-   |-        |");

        for (const item of collection) {
            const tenantId                = item.tenantId;
            const subscriptionId          = item.subscriptionId;
            const subscriptionDisplayName = item.subscriptionName;
            const resourceId              = new AzureResourceId(`${item.roleAssignment.scope}`);

            lines.push(
                `|${Markdown.subscription            (tenantId, subscriptionId, subscriptionDisplayName)}` +
                `|${Markdown.resourceGroup           (tenantId, subscriptionId, resourceId.resourceGroupName)}` +
                `|${Markdown.cosmosDb                (tenantId, subscriptionId, item.resourceGroupName, item.accountName)}` +
                `|${resourceId.resourceType}` +
                `|${resourceId.name}` +
                `|${Markdown.roleDefinitionCosmosDb  (item)}` +
                `|${Markdown.activeDirectoryPrincipal(item)}|`
            );
        }

        return lines.join('\n');
    }

    convertEx(collection: Array<AzureRoleAssignmentCosmosDbEx>) : string {

        const lines = new Array<string>();

        lines.push("|Status|Subscription|ResourceGroup|Resource|Instance|Role|Principal|");
        lines.push("|:-:|-|-|-|-|-|-|");

        for (const item of collection) {

            const tenantId                = item.tenantId;
            const subscriptionId          = item.subscriptionId;
            const subscriptionDisplayName = item.subscriptionName;
            const resourceId              = new AzureResourceId(`${item.roleAssignment.scope}`);

            lines.push(
                `|${Markdown.azureRoleAssignmentStatusCosmosDb(item)}` +
                `|${Markdown.subscription            (tenantId, subscriptionId, subscriptionDisplayName)}` +
                `|${Markdown.resourceGroup           (tenantId, subscriptionId, resourceId.resourceGroupName)}` +
                `|${Markdown.providerNamespace       (resourceId.providerNamespace, resourceId.resourceType)}` +
                `|${Markdown.resource                (tenantId, subscriptionId, resourceId.resourceGroupName, resourceId.providerNamespace, resourceId.resourceType, resourceId.name)}` +
                `|${Markdown.roleDefinitionCosmosDb  (item)}` +
                `|${Markdown.activeDirectoryPrincipal(item)}|`
            );
        }

        return lines.join('\n');
    }
}
