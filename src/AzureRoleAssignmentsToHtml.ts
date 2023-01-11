import { AzureResourceId                            } from "./AzureResourceId";
import { Html                                       } from "./Html";
import { AzureRoleAssignment, AzureRoleAssignmentEx } from "./models/AzureRoleAssignment";

export class AzureRoleAssignmentsToHtml{

    convert(collection: Array<AzureRoleAssignment>) : string {

        const lines = new Array<string>();

        lines.push('<!DOCTYPE html>');
        lines.push('<html lang="en">');
        lines.push('<head>');
        lines.push('  <meta charset="utf-8">');
        lines.push('  <meta http-equiv="X-UA-Compatible" content="IE=edge">');
        lines.push('  <title>Azure RoleAssignments</title>');
        lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1">');
        lines.push('  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">');
        lines.push('  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>');
        lines.push('  <style>');
        lines.push('    a { text-decoration: none; }');
        lines.push('  </style>');
        lines.push('</head>');
        lines.push('<body>');
     
        if (collection.filter(p => p.managementGroupInfo !== undefined)[0] !== undefined) {
            lines.push('<table class="table table-hover align-middle">');
            lines.push('<thead>');
            lines.push('  <tr>');
            lines.push('    <th scope="col">ManagementGroup</td>');
            lines.push('    <th scope="col">Subscription</td>');
            lines.push('    <th scope="col">Role</td>');
            lines.push('    <th scope="col">Principal</td>');
            lines.push('  </tr>');
            lines.push('</thead>');
            lines.push('<tbody>');

            for (const item of collection.filter(p => new AzureResourceId(`${p.roleAssignment.scope}`).isValid !== true)) {

                const tenantId                = item.tenantId;
                const subscriptionId          = item.subscriptionId;
                const subscriptionDisplayName = item.subscriptionName;

                lines.push('  <tr>');
                lines.push(`     <td>${Html.managementGroup(item)}</td>`);
                lines.push(`     <td>${Html.subscription(tenantId, subscriptionId, subscriptionDisplayName)}</td>`);
                lines.push(`     <td>${Html.roleDefinition(item)}</td>`);
                lines.push(`     <td>${Html.activeDirectoryPrincipal(item)}</td>`);
                lines.push('  </tr>');
            }
            lines.push('  </tbody>');
            lines.push('</table>');
        }

        lines.push('');

        lines.push('<table class="table table-hover align-middle">');
        lines.push('  <thead>');
        lines.push('    <tr>');
        lines.push('      <th scope="col">Subscription</td>');
        lines.push('      <th scope="col">ResourceGroup</td>');
        lines.push('      <th scope="col">Resource</td>');
        lines.push('      <th scope="col">Instance</td>');
        lines.push('      <th scope="col">Role</td>');
        lines.push('      <th scope="col">Principal</td>');
        lines.push('    </tr>');
        lines.push('  </thead>');
        lines.push('  <tbody>');

        for (const item of collection.filter(p => new AzureResourceId(`${p.roleAssignment.scope}`).isValid === true)) {

            const tenantId                = item.tenantId;
            const subscriptionId          = item.subscriptionId;
            const subscriptionDisplayName = item.subscriptionName;
            const resourceId              = new AzureResourceId(`${item.roleAssignment.scope}`);

            lines.push('  <tr>');
            lines.push(`     <td>${Html.subscription            (tenantId, subscriptionId, subscriptionDisplayName)}</td>`);
            lines.push(`     <td>${Html.resourceGroup           (tenantId, subscriptionId, resourceId.resourceGroupName)}</td>`);
            lines.push(`     <td>${Html.providerNamespace       (resourceId.providerNamespace, resourceId.resourceType)}</td>`);
            lines.push(`     <td>${Html.resource                (tenantId, subscriptionId, resourceId.resourceGroupName, resourceId.providerNamespace, resourceId.resourceType, resourceId.name)}</td>`);
            lines.push(`     <td>${Html.roleDefinition          (item)}</td>`);
            lines.push(`     <td>${Html.activeDirectoryPrincipal(item)}</td>`);
            lines.push('  </tr>');
        }
        lines.push('  </tbody>');
        lines.push('</table>');
        lines.push('</body>');
        return lines.join('\n');
    }

    convertEx(collection: Array<AzureRoleAssignmentEx>) : string {

        const lines = new Array<string>();

        lines.push('<!DOCTYPE html>');
        lines.push('<html lang="en">');
        lines.push('<head>');
        lines.push('  <meta charset="utf-8">');
        lines.push('  <meta http-equiv="X-UA-Compatible" content="IE=edge">');
        lines.push('  <title>Azure RoleAssignments</title>');
        lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1">');
        lines.push('  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">');
        lines.push('  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>');
        lines.push('  <style>');
        lines.push('    a { text-decoration: none; }');
        lines.push('  </style>');
        lines.push('</head>');
        lines.push('<body>');

        // if (collection.filter(p => p.managementGroupInfo !== undefined)[0] !== undefined) {
        //     // ManagementGroups are not supported on all subscriptions
        //     lines.push("|ManagementGroup|Subscription|Role|Principal|");
        //     lines.push("|-|-|-|-|");

        //     for (const item of collection.filter(p => new AzureResourceId(`${p.roleAssignment.scope}`).isValid !== true)) {

        //         const tenantId                = item.tenantId;
        //         const subscriptionId          = item.subscriptionId;
        //         const subscriptionDisplayName = item.subscriptionName;

        //         lines.push(
        //             `|${Html.managementGroup(item)}` +
        //             `|${Html.subscription(tenantId, subscriptionId, subscriptionDisplayName)}` +
        //             `|${Html.roleDefinition(item)}`+
        //             `|${Html.activeDirectoryPrincipal(item)}|`
        //         );
        //     }
        // }

        if (collection.filter(p => p.managementGroupInfo !== undefined)[0] !== undefined) {
            lines.push('<table class="table table-hover align-middle">');
            lines.push('<thead>');
            lines.push('  <tr>');
            lines.push('    <th scope="col">ManagementGroup</td>');
            lines.push('    <th scope="col">Subscription</td>');
            lines.push('    <th scope="col">Role</td>');
            lines.push('    <th scope="col">Principal</td>');
            lines.push('  </tr>');
            lines.push('</thead>');
            lines.push('<tbody>');

            for (const item of collection.filter(p => new AzureResourceId(`${p.roleAssignment.scope}`).isValid !== true)) {

                const tenantId                = item.tenantId;
                const subscriptionId          = item.subscriptionId;
                const subscriptionDisplayName = item.subscriptionName;

                lines.push('  <tr>');
                lines.push(`     <td>${Html.managementGroup(item)}</td>`);
                lines.push(`     <td>${Html.subscription(tenantId, subscriptionId, subscriptionDisplayName)}</td>`);
                lines.push(`     <td>${Html.roleDefinition(item)}</td>`);
                lines.push(`     <td>${Html.activeDirectoryPrincipal(item)}</td>`);
                lines.push('  </tr>');
            }
            lines.push('  </tbody>');
            lines.push('</table>');
        }

        lines.push("");

        // lines.push("|Status|Subscription|ResourceGroup|Resource|Instance|Role|Principal|");
        // lines.push("|:-:|-|-|-|-|-|-|");

        // for (const item of collection.filter(p => new AzureResourceId(`${p.roleAssignment.scope}`).isValid === true)) {

        //     const tenantId                = item.tenantId;
        //     const subscriptionId          = item.subscriptionId;
        //     const subscriptionDisplayName = item.subscriptionName;
        //     const resourceId              = new AzureResourceId(`${item.roleAssignment.scope}`);

        //     lines.push(
        //         `|${Html.azureRoleAssignmentStatus(item)}` +
        //         `|${Html.subscription            (tenantId, subscriptionId, subscriptionDisplayName)}` +
        //         `|${Html.resourceGroup           (tenantId, subscriptionId, resourceId.resourceGroupName)}` +
        //         `|${Html.providerNamespace       (resourceId.providerNamespace, resourceId.resourceType)}` +
        //         `|${Html.resource                (tenantId, subscriptionId, resourceId.resourceGroupName, resourceId.providerNamespace, resourceId.resourceType, resourceId.name)}` +
        //         `|${Html.roleDefinition          (item)}` +
        //         `|${Html.activeDirectoryPrincipal(item)}|`
        //     );
        // }

        lines.push('<table class="table table-hover align-middle">');
        lines.push('  <thead>');
        lines.push('    <tr>');
        lines.push('      <th scope="col">Status</td>');
        lines.push('      <th scope="col">Subscription</td>');
        lines.push('      <th scope="col">ResourceGroup</td>');
        lines.push('      <th scope="col">Resource</td>');
        lines.push('      <th scope="col">Instance</td>');
        lines.push('      <th scope="col">Role</td>');
        lines.push('      <th scope="col">Principal</td>');
        lines.push('    </tr>');
        lines.push('  </thead>');
        lines.push('  <tbody>');

        for (const item of collection.filter(p => new AzureResourceId(`${p.roleAssignment.scope}`).isValid === true)) {

            const tenantId                = item.tenantId;
            const subscriptionId          = item.subscriptionId;
            const subscriptionDisplayName = item.subscriptionName;
            const resourceId              = new AzureResourceId(`${item.roleAssignment.scope}`);

            lines.push('  <tr>');
            lines.push(`     <td>${Html.azureRoleAssignmentStatus(item)}</td>`);
            lines.push(`     <td>${Html.subscription            (tenantId, subscriptionId, subscriptionDisplayName)}</td>`);
            lines.push(`     <td>${Html.resourceGroup           (tenantId, subscriptionId, resourceId.resourceGroupName)}</td>`);
            lines.push(`     <td>${Html.providerNamespace       (resourceId.providerNamespace, resourceId.resourceType)}</td>`);
            lines.push(`     <td>${Html.resource                (tenantId, subscriptionId, resourceId.resourceGroupName, resourceId.providerNamespace, resourceId.resourceType, resourceId.name)}</td>`);
            lines.push(`     <td>${Html.roleDefinition          (item)}</td>`);
            lines.push(`     <td>${Html.activeDirectoryPrincipal(item)}</td>`);
            lines.push('  </tr>');
        }
        lines.push('  </tbody>');
        lines.push('</table>');
        lines.push('</body>');

        return lines.join('\n');
    }
}
