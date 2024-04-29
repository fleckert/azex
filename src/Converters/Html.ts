import { ActiveDirectoryGroup                       } from "../models/ActiveDirectoryGroup";
import { ActiveDirectoryServicePrincipal            } from "../models/ActiveDirectoryServicePrincipal";
import { ActiveDirectoryUser                        } from "../models/ActiveDirectoryUser";
import { AzurePortalLinks                           } from "../AzurePortalLinks";
import { AzureRoleAssignment, AzureRoleAssignmentEx } from "../models/AzureRoleAssignment";
import { Md5                                        } from "ts-md5";
import { RoleAssignmentHelper                       } from "../RoleAssignmentHelper";
import { AzureRoleAssignmentCosmosDb, AzureRoleAssignmentCosmosDbEx } from "../models/AzureRoleAssignmentCosmosDb";

export class Html {
    private static readonly lineBreak = "&#013;";

    static activeDirectoryPrincipal(item: AzureRoleAssignment): string {

        const principalId = item.principal?.id ?? `${item.roleAssignment.principalId}`;

        if (item.principal?.type === 'ServicePrincipal' && item.principal as ActiveDirectoryServicePrincipal !== undefined) {
            return Html.activeDirectoryServicePrincipal(item.principal as ActiveDirectoryServicePrincipal);
        }
        if (item.principal?.type === 'User' && item.principal as ActiveDirectoryUser !== undefined) {
            return Html.activeDirectoryUser(item.principal as ActiveDirectoryUser);
        }
        if (item.principal?.type === 'Group' && item.principal as ActiveDirectoryGroup !== undefined) {
            return Html.activeDirectoryGroup(item.principal as ActiveDirectoryGroup);
        }
        if (item.principal?.displayName !== undefined) {
            return `${item.principal.displayName}<br/>id ${principalId}`;
        }

        return principalId;
    }
    static activeDirectoryPrincipalCosmosDb(item: AzureRoleAssignmentCosmosDb): string {

        const principalId = item.principal?.id ?? `${item.roleAssignment.principalId}`;

        if (item.principal?.type === 'ServicePrincipal' && item.principal as ActiveDirectoryServicePrincipal !== undefined) {
            return Html.activeDirectoryServicePrincipal(item.principal as ActiveDirectoryServicePrincipal);
        }
        if (item.principal?.type === 'User' && item.principal as ActiveDirectoryUser !== undefined) {
            return Html.activeDirectoryUser(item.principal as ActiveDirectoryUser);
        }
        if (item.principal?.type === 'Group' && item.principal as ActiveDirectoryGroup !== undefined) {
            return Html.activeDirectoryGroup(item.principal as ActiveDirectoryGroup);
        }
        if (item.principal?.displayName !== undefined) {
            return `${item.principal.displayName}<br/>id ${principalId}`;
        }

        return principalId;
    }
    static activeDirectoryServicePrincipal(principal: ActiveDirectoryServicePrincipal): string {
        const title = `${principal.servicePrincipalType} ${principal.displayName}`;
        const url = AzurePortalLinks.servicePrincipal(principal.id, principal.appId);
        const tooltip = `ServicePrincipal${this.lineBreak}` +
            `-----------------${this.lineBreak}` +
            `displayName ${principal.displayName}${this.lineBreak}` +
            `id                   ${principal.id}${this.lineBreak}` +
            `appId             ${principal.appId}${this.lineBreak}` +
            `type               ${principal.servicePrincipalType}`;

        return this.getLinkWithToolTip(title, url, tooltip);
    }
    static activeDirectoryUser(principal: ActiveDirectoryUser): string {
        const title = `User ${principal.displayName}`;
        const url = AzurePortalLinks.user(principal.id);
        const tooltip = `User${this.lineBreak}` +
            `-----${this.lineBreak}` +
            `displayName          ${principal.displayName}${this.lineBreak}` +
            `id                            ${principal.id}${this.lineBreak}` +
            `userPrincipalName ${principal.userPrincipalName}`;

        return this.getLinkWithToolTip(title, url, tooltip);
    }
    static activeDirectoryGroup(principal: ActiveDirectoryGroup): string {
        const title = `Group ${principal.displayName}`;
        const url = AzurePortalLinks.group(principal.id);;
        const tooltip = `Group${this.lineBreak}` +
            `-------${this.lineBreak}` +
            `displayName ${principal.displayName}${this.lineBreak}` +
            `id                   ${principal.id}`;

        return this.getLinkWithToolTip(title, url, tooltip);
    }

    static getLinkWithToolTip(title: string, url: string, tooltip: string) {
        // x-my-search is to enable searching by title... <a href=... may be an id or any string, but the title is visible
        return `<a x-my-search="${title}" href="${url}" title="${tooltip}" target="_blank">${title}</a>`;
    }

    static subscription(tenantId: string, subscriptionId: string, subscriptionDisplayName: string | undefined): string {
        const markdown
            = Html.getLinkWithToolTip(
                subscriptionDisplayName ?? subscriptionId,
                AzurePortalLinks.subscriptionOverview(tenantId, subscriptionId),
                `show link to subscription '${subscriptionDisplayName ?? subscriptionId}'`);

        return markdown;
    }

    static resourceGroup(tenantId: string, subscriptionId: string, resourceGroupName: string | undefined): string {
        const markdown
            = resourceGroupName === undefined
            ? ''
            : Html.getLinkWithToolTip(
                resourceGroupName,
                AzurePortalLinks.resourceGroupOverview(tenantId, subscriptionId, resourceGroupName),
                `show link to resourceGroup '${resourceGroupName}'`);

        return markdown;
    }

    static providerNamespace(providerNamespace: string | undefined, resourceType: string | undefined): string {
        const markdown
            = providerNamespace === undefined || resourceType === undefined
            ? '' 
            : Html.getLinkWithToolTip(
                `${providerNamespace}<br/>${resourceType}`,
                `https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/${providerNamespace}%2F${resourceType}`,
                `show link to '${providerNamespace}/${resourceType}' resources`)
            ;

        return markdown;
    }

    static provider(provider: string | undefined): string {
        const markdown
            = provider === undefined
            ? ''
            : provider;

        return markdown;
    }

    static resourceSlim(tenantId: string, subscriptionId: string, resourceGroupName: string | undefined, provider: string | undefined, resource: string | undefined): string {
        const markdown
            = resourceGroupName ===undefined || provider === undefined || resource === undefined
            ? ''
            : Html.getLinkWithToolTip(
                resource,
                `https://portal.azure.com/#@${tenantId}/resource/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/${provider}/${resource}`,
                `show link to '${resource}'`)
            ;

        return markdown;
    }
    static cosmosDb(tenantId: string, subscriptionId: string, resourceGroupName: string, accountName: string, resource:string): string {
        const markdown
            = Html.getLinkWithToolTip(
                resource,
                `https://portal.azure.com/#@${tenantId}/resource/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/overview`,
                `show link to '${resource}'`)
            ;

        return markdown;
    }

    static resource(tenantId: string, subscriptionId: string, resourceGroupName: string | undefined, providerNamespace: string | undefined, resourceType: string | undefined, name: string | undefined): string {
        const markdown
            = resourceGroupName ===undefined || providerNamespace === undefined || resourceType === undefined || name === undefined
            ? ''
            : Html.getLinkWithToolTip(
                name,
                `https://portal.azure.com/#@${tenantId}/resource/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/${providerNamespace}/${resourceType}/${name}`,
                `show link to '${name}'`)
            ;

        return markdown;
    }

    static roleDefinition(item: AzureRoleAssignment): string {
        if (item.roleDefinition.roleType === 'BuiltInRole') {
            const title   = `${item.roleDefinition.roleName}`;
            const url     = `https://docs.microsoft.com/en-us/azure/role-based-access-control/built-in-roles`;
            const tooltip = `${item.roleDefinition.description}${this.lineBreak}${this.lineBreak}show link to ${url}`;

            return Html.getLinkWithToolTip(title, url, tooltip);
        }

        if (item.roleDefinition.roleType === 'CustomRole') {
            const title   = `${item.roleDefinition.roleName}`;
            const url     = `https://learn.microsoft.com/en-us/azure/role-based-access-control/custom-roles`;
            const tooltip = `${item.roleDefinition.description}${this.lineBreak}${this.lineBreak}show link to ${url}`;

            return Html.getLinkWithToolTip(title, url, tooltip);
        }

        return `${item.roleDefinition.roleName}`;
    }
    static roleDefinitionCosmosDb(item: AzureRoleAssignmentCosmosDb): string {
        if (item.roleDefinition.typePropertiesType === 'BuiltInRole') {
            const title   = `${item.roleDefinition.roleName}`;
            const url     = `https://docs.microsoft.com/en-us/azure/role-based-access-control/built-in-roles`;
            const tooltip = ''//`${item.roleDefinition.description}${this.lineBreak}${this.lineBreak}show link to ${url}`;

            return Html.getLinkWithToolTip(title, url, tooltip);
        }

        if (item.roleDefinition.typePropertiesType === 'CustomRole') {
            const title   = `${item.roleDefinition.roleName}`;
            const url     = `https://learn.microsoft.com/en-us/azure/role-based-access-control/custom-roles`;
            const tooltip = ''//`${item.roleDefinition.description}${this.lineBreak}${this.lineBreak}show link to ${url}`;

            return Html.getLinkWithToolTip(title, url, tooltip);
        }

        return `${item.roleDefinition.roleName}`;
    }

    static managementGroup(item: AzureRoleAssignment): string {
        
        const managementGroupText0
            = `${item.roleAssignment.scope}` === `${item.managementGroupInfo?.id}` && item.managementGroupInfo?.displayName !== undefined
            ? Html.getLinkWithToolTip(item.managementGroupInfo.displayName, AzurePortalLinks.managementGroupOverview(item.managementGroupInfo), `show link to managementGroup '${item.managementGroupInfo.displayName}'`)
            : undefined;

        const managementGroupText1 = RoleAssignmentHelper.getManagementGroupName(item.roleAssignment);

        const managementGroupText = managementGroupText0 ?? managementGroupText1 ?? "";

        return managementGroupText;
    }

    static azureRoleAssignmentStatus(item: AzureRoleAssignmentEx): string | undefined{
        const tooltip = 
        `scope${this.lineBreak}    ${item.roleAssignment.scope}${this.lineBreak}${this.lineBreak}`+
        `principalId${this.lineBreak}    ${item.principal?.id}${this.lineBreak}${this.lineBreak}`+
        `roleDefinitionId${this.lineBreak}    ${item.roleDefinition.id}`;

        switch (item.roleAssignmentStatus) {
            case 'missing-rbac'    : return `<div style="color:red" title="${tooltip}">missing<br/>rbac</div>`;
            case 'missing-resource': return `<div style="color:red" title="${tooltip}">missing<br/>resource</div>`  ;
            case 'okay'            : return `<div style="color:green" title="${tooltip}">okay</div>`            ;
            case 'unexpected-rbac' : return `<div style="color:yellow" title="${tooltip}">unexpected<br/>rbac</div>`;
            default: return undefined;
        }
    }
    static azureRoleAssignmentStatusCosmosDb(item: AzureRoleAssignmentCosmosDbEx): string | undefined{
        const tooltip = 
        `scope${this.lineBreak}    ${item.roleAssignment.scope}${this.lineBreak}${this.lineBreak}`+
        `principalId${this.lineBreak}    ${item.principal?.id}${this.lineBreak}${this.lineBreak}`+
        `roleDefinitionId${this.lineBreak}    ${item.roleDefinition.id}`;

        switch (item.roleAssignmentStatus) {
            case 'missing-rbac'    : return `<div style="color:red" title="${tooltip}">missing<br/>rbac</div>`;
            case 'missing-resource': return `<div style="color:red" title="${tooltip}">missing<br/>resource</div>`  ;
            case 'okay'            : return `<div style="color:green" title="${tooltip}">okay</div>`            ;
            case 'unexpected-rbac' : return `<div style="color:yellow" title="${tooltip}">unexpected<br/>rbac</div>`;
            default: return undefined;
        }
    }

    static getMermaidDiagramForHierarchy(items: Array<{ container: string | undefined, member: string | undefined }>, title: string): string {
        const id = (value: string | undefined) => Buffer.from(value ?? '').toString('hex');
        const itemToMarkdown = (value: string | undefined) => `${id(value)}["${value}"]`;

        const lines = new Array<string>();

        lines.push('<!DOCTYPE html>');
        lines.push('<html lang="en">');
        lines.push('<head>');
        lines.push('    <meta charset="UTF-8">');
        lines.push('    <meta http-equiv="X-UA-Compatible" content="IE=edge">');
        lines.push('    <meta name="viewport" content="width=device-width, initial-scale=1.0">');
        lines.push(`    <title>${title}</title>`);
        lines.push('    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>');
        lines.push('    <script>mermaid.initialize({startOnLoad:true});</script>');
        lines.push('</head>');
        lines.push('');
        lines.push('<body>');
        if (items.length === 0) {
            lines.push("nothing to display");
        } else {
            lines.push('    <div class="mermaid">');
            lines.push('        graph BT;');
            lines.push('        ');

            for (const item of items) {
                lines.push(`            ${itemToMarkdown(item.member)} --> |member of| ${itemToMarkdown(item.container)}`);
            }
            lines.push('    </div>');
            lines.push('</body>');
        }
        lines.push('</html>');

        return lines.join('\n');
    }

    static getMermaidDiagramForHierarchyWithStylesAndLinks(
        items : Array<{ container: string | undefined, member: string | undefined }>,
        focus : Array<{ value: string }>, 
        styles: Array<{ value: string, style: string }>, 
        links : Array<{ value: string, href: string, target: '_self' | '_blank' | '_parent' | '_top' }>,
        title: string
    ): string {

        const id = (value: string | undefined) => Md5.hashStr(value ?? '');

        // https://rich-iannone.github.io/DiagrammeR/mermaid.html#node-shape-and-text
        const itemToMarkdown = (focus: Array<{ value: string }>, value: string | undefined) => `${id(value)}${focus.find(p => p.value === value) === undefined ? '[' : '('}"${value}"${focus.find(p => p.value === value) === undefined ? ']' : ')'}`;

        const lines = new Array<string>();

        lines.push('<!DOCTYPE html>');
        lines.push('<html lang="en">');
        lines.push('<head>');
        lines.push('    <meta charset="UTF-8">');
        lines.push('    <meta http-equiv="X-UA-Compatible" content="IE=edge">');
        lines.push('    <meta name="viewport" content="width=device-width, initial-scale=1.0">');
        lines.push(`    <title>${title}</title>`);
        lines.push('    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>');
        lines.push('    <script>mermaid.initialize({startOnLoad:true});</script>');
        lines.push('</head>');
        lines.push('');
        lines.push('<body>');
        if (items.length === 0) {
            lines.push("nothing to display");
        } else {
            lines.push('    <div class="mermaid">');
            lines.push('        graph BT;');
            lines.push('        ');
            for (const item of items) {
                lines.push(`            ${itemToMarkdown(focus, item.member)} --> |member of| ${itemToMarkdown(focus, item.container)}`);
            }

            lines.push('');
            lines.push('            %% ----------------------------------------------------------------');
            lines.push('            %% https://mermaid.js.org/syntax/flowchart.html#styling-and-classes');
            lines.push('            %% ----------------------------------------------------------------');

            for (const item of styles) {
                lines.push('');
                if (item.value !== '') {
                    lines.push(`            %% ${item.value}`);
                    lines.push(`            style ${id(item.value)} ${item.style}`);
                }

                if (item.value === '') {
                    lines.push(`            %% all`);
                    lines.push(`            classDef default ${item.style}`);
                }
            }

            lines.push('');
            lines.push('            %% --------------------------------------------------------');
            lines.push('            %% https://mermaid.js.org/syntax/flowchart.html#interaction');
            lines.push('            %% --------------------------------------------------------');
            for (const item of links) {
                lines.push('');
                lines.push(`            %% ${item.value}`);
                lines.push(`            click ${id(item.value)} "${item.href}" ${item.target}`)
            }

            lines.push('    </div>');
            lines.push('</body>');
        }
        lines.push('</html>');

        return lines.join('\n');

    }
    static table(title: string, headers: Array<string>, collection: Array<Array<string>>): string {

        const lines = new Array<string>();

        lines.push('<!DOCTYPE html>');
        lines.push('<html lang="en">');
        lines.push('<head>');
        lines.push('  <meta charset="utf-8">');
        lines.push('  <meta http-equiv="X-UA-Compatible" content="IE=edge">');
        lines.push(`  <title>${title}</title>`);
        lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1">');
        lines.push('  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">');
        lines.push('  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>');
        lines.push('  <style>');
        lines.push('    a { text-decoration: none; }');
        lines.push('  </style>');
        lines.push('</head>');
        lines.push('<body>');
        lines.push(`<h2>${title}</h2>`);
        lines.push('<table class="table table-hover align-middle">');
        lines.push('  <thead>');
        lines.push('    <tr>');
        for (const header of headers) {
            lines.push(`      <th scope="col">${header}</td>`);
        }
        lines.push('    </tr>');
        lines.push('  </thead>');
        lines.push('  <tbody>');

        for (const items of collection) {
            lines.push('  <tr>');
            for (const item of items) {
                lines.push(`     <td>${item}</td>`);
            }
            lines.push('  </tr>');
        }
        lines.push('  </tbody>');
        lines.push('</table>');
        lines.push('</body>');

        return lines.join('\n');
    }

    static tableWithSorting(title: string, headers: Array<string>, collection: Array<Array<string>>, dataPageSize = 100): string {

        const lines = new Array<string>();

        lines.push('<!DOCTYPE html>');
        lines.push('<html lang="en">');
        lines.push('<head>');
        lines.push('  <meta charset="utf-8">');
        lines.push('  <meta http-equiv="X-UA-Compatible" content="IE=edge">');
        lines.push(`  <title>${title}</title>`);
        lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1">');
        lines.push('  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">');
        lines.push('  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css">');
        lines.push('  <link rel="stylesheet" href="https://unpkg.com/bootstrap-table@1.21.3/dist/bootstrap-table.min.css">');
        
        lines.push('  <style>');
        lines.push('    a { text-decoration: none; }');
        lines.push('  </style>');
        lines.push('</head>');
        lines.push('<body>');
        lines.push(`<h2>${title}</h2>`);
        lines.push('<table data-toggle="table"                ' +
                          'data-search="true"                 ' + // https://examples.bootstrap-table.com/#options/table-search.html#view-source
                          'data-show-pagination-switch="true" ' + // https://examples.bootstrap-table.com/#options/show-pagination-switch.html#view-source
                          'data-search-highlight="true"       ' + // https://examples.bootstrap-table.com/#options/search-highlight.html#view-source
                          'data-pagination="true"             ' + // https://examples.bootstrap-table.com/#options/table-pagination.html#view-source
                          `data-page-size="${dataPageSize}"   ` + // https://examples.bootstrap-table.com/#options/page-size.html#view-source
                          'data-search-align="left"           ' + // https://examples.bootstrap-table.com/#options/search-align.html#view-source
                          '>');
        lines.push('  <thead>');
        lines.push('    <tr>');
        for (const header of headers) {
            lines.push(`      <th scope="col" data-sortable="true" data-field="${header}">${header}</td>`);
        }
        lines.push('    </tr>');
        lines.push('  </thead>');
        lines.push('  <tbody>');

        for (const items of collection) {
            lines.push('  <tr>');
            for (const item of items) {
                lines.push(`     <td style="vertical-align:top;">${item}</td>`);
            }
            lines.push('  </tr>');
        }
        lines.push('  </tbody>');
        lines.push('</table>');

        lines.push('<script src="https://cdn.jsdelivr.net/npm/jquery/dist/jquery.min.js"></script>');
        lines.push('<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossorigin="anonymous"></script>');
        lines.push('<script src="https://unpkg.com/bootstrap-table@1.21.3/dist/bootstrap-table.min.js"></script>');

        lines.push('</body>');

        return lines.join('\n');
    }
}
