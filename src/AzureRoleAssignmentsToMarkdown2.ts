import { AzurePortalLinks    } from "./AzurePortalLinks";
import { Markdown            } from "./Markdown";
import { AzureRoleAssignment, AzureRoleAssignmentEx } from "./models/AzureRoleAssignment";

export class AzureRoleAssignmentsToMarkdown2{

    convert(collection: Array<AzureRoleAssignment>) : string {

        const lines = new Array<string>();

        if (collection.filter(p => p.managementGroupInfo !== undefined)[0] !== undefined) {
            // ManagementGroups are not supported on all subscriptions
            lines.push("|ManagementGroup|Subscription|Role|Principal|");
            lines.push("|-|-|-|-|");

            for (const item of collection.filter(p => p.resourceId?.isValid !== true)) {

                const tenantId                = item.tenantId;
                const subscriptionId          = item.subscriptionId;
                const subscriptionDisplayName = item.subscriptionName;

                lines.push(
                    `|${Markdown.managementGroup(item)}` +
                    `|${Markdown.subscription(tenantId, subscriptionId, subscriptionDisplayName)}` +
                    `|${Markdown.roleDefinition(item)}`+
                    `|${Markdown.activeDirectoryPrincipal(item)}|`
                );
            }
        }

        lines.push("");

        lines.push("|Subscription|ResourceGroup|Resource|Instance|Role|Principal|");
        lines.push("|-|-|-|-|-|-|");

        for (const item of collection.filter(p => p.resourceId?.isValid === true)) {

            const tenantId                = item.tenantId;
            const subscriptionId          = item.subscriptionId;
            const subscriptionDisplayName = item.subscriptionName;

            lines.push(
                `|${Markdown.subscription            (tenantId, subscriptionId, subscriptionDisplayName)}` +
                `|${Markdown.resourceGroup           (tenantId, subscriptionId, item.resourceId?.resourceGroupName)}` +
                `|${Markdown.providerNamespace       (item.resourceId?.providerNamespace, item.resourceId?.resourceType)}` +
                `|${Markdown.resource                (tenantId, subscriptionId, item.resourceId?.resourceGroupName, item.resourceId?.providerNamespace, item.resourceId?.resourceType, item.resourceId?.name)}` +
                `|${Markdown.roleDefinition          (item)}` +
                `|${Markdown.activeDirectoryPrincipal(item)}|`
            );
        }

        return lines.join('\n');
    }

    convertEx(collection: Array<AzureRoleAssignmentEx>) : string {

        const lines = new Array<string>();

        if (collection.filter(p => p.managementGroupInfo !== undefined)[0] !== undefined) {
            // ManagementGroups are not supported on all subscriptions
            lines.push("|ManagementGroup|Subscription|Role|Principal|");
            lines.push("|-|-|-|-|");

            for (const item of collection.filter(p => p.resourceId?.isValid !== true)) {

                const tenantId                = item.tenantId;
                const subscriptionId          = item.subscriptionId;
                const subscriptionDisplayName = item.subscriptionName;

                lines.push(
                    `|${Markdown.managementGroup(item)}` +
                    `|${Markdown.subscription(tenantId, subscriptionId, subscriptionDisplayName)}` +
                    `|${Markdown.roleDefinition(item)}`+
                    `|${Markdown.activeDirectoryPrincipal(item)}|`
                );
            }
        }

        lines.push("");

        lines.push("|Status|Subscription|ResourceGroup|Resource|Instance|Role|Principal|");
        lines.push("|:-:|-|-|-|-|-|-|");

        for (const item of collection.filter(p => p.resourceId?.isValid === true)) {

            const tenantId                = item.tenantId;
            const subscriptionId          = item.subscriptionId;
            const subscriptionDisplayName = item.subscriptionName;

            lines.push(
                `|${Markdown.azureRoleAssignmentStatus(item)}` +
                `|${Markdown.subscription            (tenantId, subscriptionId, subscriptionDisplayName)}` +
                `|${Markdown.resourceGroup           (tenantId, subscriptionId, item.resourceId?.resourceGroupName)}` +
                `|${Markdown.providerNamespace       (item.resourceId?.providerNamespace, item.resourceId?.resourceType)}` +
                `|${Markdown.resource                (tenantId, subscriptionId, item.resourceId?.resourceGroupName, item.resourceId?.providerNamespace, item.resourceId?.resourceType, item.resourceId?.name)}` +
                `|${Markdown.roleDefinition          (item)}` +
                `|${Markdown.activeDirectoryPrincipal(item)}|`
            );
        }

        return lines.join('\n');
    }
}
