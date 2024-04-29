import { AzureResourceIdSlim         } from "../AzureResourceIdSlim";
import { Html                        } from "./Html"; 
import { AzureRoleAssignmentCosmosDb } from "../models/AzureRoleAssignmentCosmosDb";

export class AzureRoleAssignmentsCosmosDbToHtml{

    convert(collection: Array<AzureRoleAssignmentCosmosDb>) : string {

        const lines = new Array<string>();

        lines.push('<!DOCTYPE html>');
        lines.push('<html lang="en">');
        lines.push('<head>');
        lines.push('  <meta charset="utf-8">');
        lines.push('  <meta http-equiv="X-UA-Compatible" content="IE=edge">');
        lines.push('  <title>Azure CosmosDB RoleAssignments</title>');
        lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1">');
        lines.push('  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">');
        lines.push('  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>');
        lines.push('  <style>');
        lines.push('    a { text-decoration: none; }');
        lines.push('  </style>');
        lines.push('</head>');
        lines.push('<body>');

        lines.push('<table class="table table-hover align-middle">');
        lines.push('  <thead>');
        lines.push('    <tr>');
        lines.push('      <th scope="col">Subscription</td>');
        lines.push('      <th scope="col">ResourceGroup</td>');
        lines.push('      <th scope="col">Resource</td>');
        lines.push('      <th scope="col">Role</br>Principal');
        lines.push('    </tr>');
        lines.push('  </thead>');
        lines.push('  <tbody>');

        for (const item of collection) {

            const tenantId                = item.tenantId;
            const subscriptionId          = item.subscriptionId;
            const subscriptionDisplayName = item.subscriptionName;
            const resourceId              = new AzureResourceIdSlim(`${item.roleAssignment.scope}`);
 
            lines.push('  <tr>');
            lines.push(`     <td>${Html.subscription                    (tenantId, subscriptionId, subscriptionDisplayName)}</td>`);
            lines.push(`     <td>${Html.resourceGroup                   (tenantId, subscriptionId, resourceId.resourceGroupName)}</td>`);
            lines.push(`     <td>${Html.cosmosDb                        (tenantId, subscriptionId, item.resourceGroupName, item.accountName, resourceId.resource ?? item.accountName)}</td>`);
            lines.push(`     <td>${Html.roleDefinitionCosmosDb          (item)}`);
            lines.push(`    </br>${Html.activeDirectoryPrincipalCosmosDb(item)}</td>`);
            lines.push('  </tr>');
        }
        lines.push('  </tbody>');
        lines.push('</table>');
        lines.push('</body>');
        return lines.join('\n');
    }
}
