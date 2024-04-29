import { AzureResourceIdSlim                        } from "../AzureResourceIdSlim";
import { Markdown                                   } from "./Markdown";
import { AzureRoleAssignment, AzureRoleAssignmentEx } from "../models/AzureRoleAssignment";
import { RoleAssignmentHelper                       } from "../RoleAssignmentHelper";

export class AzureRoleAssignmentsToMarkdown{

    convert(collection: Array<AzureRoleAssignment>) : string {

        const lines = new Array<string>();

        const collectionManagementGroups = collection.filter(p => RoleAssignmentHelper.isManagementGroupScope(p.roleAssignment));

        if (collectionManagementGroups.length > 0) {
            // ManagementGroups are not supported on all subscriptions
            lines.push("|ManagementGroup|Subscription|Role<br/>Principal|");
            lines.push("|-              |-           |-                 |");

            for (const item of collectionManagementGroups) {

                const tenantId                = item.tenantId;
                const subscriptionId          = item.subscriptionId;
                const subscriptionDisplayName = item.subscriptionName;

                lines.push(
                    `|${Markdown.managementGroup(item)}` +
                    `|${Markdown.subscription(tenantId, subscriptionId, subscriptionDisplayName)}` +
                    `|${Markdown.roleDefinition(item)}`+
                    `<br/>${Markdown.activeDirectoryPrincipal(item)}|`
                );
            }
        }

        lines.push("");

        lines.push("|Subscription|ResourceGroup|Resource<br/>Instance|Role<br/>Principal|");
        lines.push("|-|-|-|-|");

        const collectionSubscription = collection.filter(p => RoleAssignmentHelper.isManagementGroupScope(p.roleAssignment) === false);

        for (const item of collectionSubscription) {

            const tenantId                = item.tenantId;
            const subscriptionId          = item.subscriptionId;
            const subscriptionDisplayName = item.subscriptionName;
            const resourceId              = new AzureResourceIdSlim(`${item.roleAssignment.scope}`);

            lines.push(
                `|${Markdown.subscription            (tenantId, subscriptionId, subscriptionDisplayName)}` +
                `|${Markdown.resourceGroup           (tenantId, subscriptionId, resourceId.resourceGroupName)}` +
                `|${Markdown.provider                (resourceId.provider)}` +
                `<br/>${Markdown.resourceSlim            (tenantId, subscriptionId, resourceId.resourceGroupName, resourceId.provider, resourceId.resource)}` +
                `|${Markdown.roleDefinition          (item)}` +
                `<br/>${Markdown.activeDirectoryPrincipal(item)}|`
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

        lines.push("|Status|Subscription|ResourceGroup|Resource<br/>Instance|Role|Principal|");
        lines.push("|:-:|-|-|-|-|-|");

        const collectionSubscription = collection.filter(p => RoleAssignmentHelper.isManagementGroupScope(p.roleAssignment) === false);

        for (const item of collectionSubscription) {

            const tenantId                = item.tenantId;
            const subscriptionId          = item.subscriptionId;
            const subscriptionDisplayName = item.subscriptionName;
            const resourceId              = new AzureResourceIdSlim(`${item.roleAssignment.scope}`);

            lines.push(
                `|${Markdown.azureRoleAssignmentStatus(item)}` +
                `|${Markdown.subscription            (tenantId, subscriptionId, subscriptionDisplayName)}` +
                `|${Markdown.resourceGroup           (tenantId, subscriptionId, resourceId.resourceGroupName)}` +
                `|${Markdown.provider                (resourceId.provider)}` +
                `<br/>${Markdown.resourceSlim            (tenantId, subscriptionId, resourceId.resourceGroupName, resourceId.provider, resourceId.resource)}` +
                `|${Markdown.roleDefinition          (item)}` +
                `|${Markdown.activeDirectoryPrincipal(item)}|`
            );
        }

        return lines.join('\n');
    }
}
