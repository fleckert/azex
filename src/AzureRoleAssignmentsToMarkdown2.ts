import { AzureResourceId                            } from "./AzureResourceId";
import { Markdown                                   } from "./Markdown";
import { AzureRoleAssignment, AzureRoleAssignmentEx } from "./models/AzureRoleAssignment";
import { RoleAssignmentHelper                       } from "./RoleAssignmentHelper";

export class AzureRoleAssignmentsToMarkdown2{

    convert(collection: Array<AzureRoleAssignment>) : string {

        const lines = new Array<string>();

        const collectionManagementGroups = collection.filter(p => RoleAssignmentHelper.isManagementGroupScope(p.roleAssignment));

        if (collectionManagementGroups.length > 0) {
            // ManagementGroups are not supported on all subscriptions
            lines.push("|ManagementGroup|Subscription|Role|Principal|");
            lines.push("|-|-|-|-|");

            for (const item of collectionManagementGroups) {

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

        const collectionSubscription = collection.filter(p => RoleAssignmentHelper.isManagementGroupScope(p.roleAssignment) === false);

        for (const item of collectionSubscription) {

            const tenantId                = item.tenantId;
            const subscriptionId          = item.subscriptionId;
            const subscriptionDisplayName = item.subscriptionName;
            const resourceId              = new AzureResourceId(`${item.roleAssignment.scope}`);

            lines.push(
                `|${Markdown.subscription            (tenantId, subscriptionId, subscriptionDisplayName)}` +
                `|${Markdown.resourceGroup           (tenantId, subscriptionId, resourceId.resourceGroupName)}` +
                `|${Markdown.providerNamespace       (resourceId.providerNamespace, resourceId.resourceType)}` +
                `|${Markdown.resource                (tenantId, subscriptionId, resourceId.resourceGroupName, resourceId.providerNamespace, resourceId.resourceType, resourceId.name)}` +
                `|${Markdown.roleDefinition          (item)}` +
                `|${Markdown.activeDirectoryPrincipal(item)}|`
            );
        }

        return lines.join('\n');
    }

    convertEx(collection: Array<AzureRoleAssignmentEx>) : string {

        const lines = new Array<string>();

        const collectionManagementGroups = collection.filter(p => RoleAssignmentHelper.isManagementGroupScope(p.roleAssignment));

        if (collectionManagementGroups.length > 0) {
            // ManagementGroups are not supported on all subscriptions
            lines.push("|ManagementGroup|Subscription|Role|Principal|");
            lines.push("|-|-|-|-|");

            for (const item of collectionManagementGroups) {

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

        const collectionSubscription = collection.filter(p => RoleAssignmentHelper.isManagementGroupScope(p.roleAssignment) === false);

        for (const item of collectionSubscription) {

            const tenantId                = item.tenantId;
            const subscriptionId          = item.subscriptionId;
            const subscriptionDisplayName = item.subscriptionName;
            const resourceId              = new AzureResourceId(`${item.roleAssignment.scope}`);

            lines.push(
                `|${Markdown.azureRoleAssignmentStatus(item)}` +
                `|${Markdown.subscription            (tenantId, subscriptionId, subscriptionDisplayName)}` +
                `|${Markdown.resourceGroup           (tenantId, subscriptionId, resourceId.resourceGroupName)}` +
                `|${Markdown.providerNamespace       (resourceId.providerNamespace, resourceId.resourceType)}` +
                `|${Markdown.resource                (tenantId, subscriptionId, resourceId.resourceGroupName, resourceId.providerNamespace, resourceId.resourceType, resourceId.name)}` +
                `|${Markdown.roleDefinition          (item)}` +
                `|${Markdown.activeDirectoryPrincipal(item)}|`
            );
        }

        return lines.join('\n');
    }
}
