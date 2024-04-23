import { ActiveDirectoryGroup                       } from "../models/ActiveDirectoryGroup";
import { ActiveDirectoryServicePrincipal            } from "../models/ActiveDirectoryServicePrincipal";
import { ActiveDirectoryUser                        } from "../models/ActiveDirectoryUser";
import { AzurePortalLinks                           } from "../AzurePortalLinks";
import { AzureRoleAssignment, AzureRoleAssignmentEx } from "../models/AzureRoleAssignment";
import { Md5                                        } from 'ts-md5'
import { RoleAssignmentHelper                       } from "../RoleAssignmentHelper";
import { AzureRoleAssignmentCosmosDb, AzureRoleAssignmentCosmosDbEx } from "../models/AzureRoleAssignmentCosmosDb";

export class Markdown {
    private static readonly lineBreak = "&#013;";

    static activeDirectoryPrincipal(item: AzureRoleAssignment | AzureRoleAssignmentCosmosDb): string {

        const principalId = item.principal?.id ?? `${item.roleAssignment.principalId}`;

        if (item.principal?.type === 'ServicePrincipal' && item.principal as ActiveDirectoryServicePrincipal !== undefined) {
            return Markdown.activeDirectoryServicePrincipal(item.principal as ActiveDirectoryServicePrincipal);
        }
        if (item.principal?.type === 'User' && item.principal as ActiveDirectoryUser !== undefined) {
            return Markdown.activeDirectoryUser(item.principal as ActiveDirectoryUser);
        }
        if (item.principal?.type === 'Group' && item.principal as ActiveDirectoryGroup !== undefined) {
            return Markdown.activeDirectoryGroup(item.principal as ActiveDirectoryGroup);
        }
        if (item.principal?.displayName !== undefined) {
            return `${item.principal.displayName}<br/>id ${principalId}`;
        }

        return principalId;
    }
    static activeDirectoryServicePrincipal(principal: ActiveDirectoryServicePrincipal): string {
        const title = `${principal.displayName}<br/>${principal.servicePrincipalType}`;
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
        const title = `${principal.displayName}<br/>User`;
        const url = AzurePortalLinks.user(principal.id);
        const tooltip = `User${this.lineBreak}` +
            `-----${this.lineBreak}` +
            `displayName          ${principal.displayName}${this.lineBreak}` +
            `id                            ${principal.id}${this.lineBreak}` +
            `userPrincipalName ${principal.userPrincipalName}`;

        return this.getLinkWithToolTip(title, url, tooltip);
    }
    static activeDirectoryGroup(principal: ActiveDirectoryGroup): string {
        const title = `${principal.displayName}<br/>Group`;
        const url = AzurePortalLinks.group(principal.id);;
        const tooltip = `Group${this.lineBreak}` +
            `-------${this.lineBreak}` +
            `displayName ${principal.displayName}${this.lineBreak}` +
            `id                   ${principal.id}`;

        return this.getLinkWithToolTip(title, url, tooltip);
    }

    static getLinkWithToolTip(title: string, url: string, tooltip: string) {
        return `[${title}](${url} "${tooltip}")`;
    }

    static subscription(tenantId: string, subscriptionId: string, subscriptionDisplayName: string | undefined): string {
        const markdown
            = Markdown.getLinkWithToolTip(
                subscriptionDisplayName ?? subscriptionId,
                AzurePortalLinks.subscriptionOverview(tenantId, subscriptionId),
                `show link to subscription '${subscriptionDisplayName ?? subscriptionId}'`);

        return markdown;
    }

    static resourceGroup(tenantId: string, subscriptionId: string, resourceGroupName: string | undefined): string {
        const markdown
            = resourceGroupName === undefined
            ? ''
            : Markdown.getLinkWithToolTip(
                resourceGroupName,
                AzurePortalLinks.resourceGroupOverview(tenantId, subscriptionId, resourceGroupName),
                `show link to resourceGroup '${resourceGroupName}'`);

        return markdown;
    }

    static providerNamespace(providerNamespace: string | undefined, resourceType: string | undefined): string {
        const markdown
            = providerNamespace === undefined || resourceType === undefined
            ? '' 
            : Markdown.getLinkWithToolTip(
                `${providerNamespace}<br/>${resourceType}`,
                `https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/${providerNamespace}%2F${resourceType}`,
                `show link to '${providerNamespace}/${resourceType}' resources`)
            ;

        return markdown;
    }

    static resource(tenantId: string, subscriptionId: string, resourceGroupName: string | undefined, providerNamespace: string | undefined, resourceType: string | undefined, name: string | undefined): string {
        const markdown
            = resourceGroupName ===undefined || providerNamespace === undefined || resourceType === undefined || name === undefined
            ? ''
            : Markdown.getLinkWithToolTip(
                name,
                `https://portal.azure.com/#@${tenantId}/resource/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/${providerNamespace}/${resourceType}/${name}`,
                `show link to '${name}'`)
            ;

        return markdown;
    }

    static cosmosDb(tenantId: string, subscriptionId: string, resourceGroupName: string, accountName: string): string {
        const markdown
            = Markdown.getLinkWithToolTip(
                accountName,
                `https://portal.azure.com/#@${tenantId}/resource/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/overview`,
                `show link to '${accountName}'`)
            ;

        return markdown;
    }

    static roleDefinition(item: AzureRoleAssignment): string {
        if (item.roleDefinition.roleType === 'BuiltInRole') {
            const title   = `${item.roleDefinition.roleName}`;
            const url     = `https://docs.microsoft.com/en-us/azure/role-based-access-control/built-in-roles`;
            const tooltip = `${item.roleDefinition.description}${this.lineBreak}${this.lineBreak}show link to ${url}`;

            return Markdown.getLinkWithToolTip(title, url, tooltip);
        }

        if (item.roleDefinition.roleType === 'CustomRole') {
            const title   = `${item.roleDefinition.roleName}`;
            const url     = `https://learn.microsoft.com/en-us/azure/role-based-access-control/custom-roles`;
            const tooltip = `${item.roleDefinition.description}${this.lineBreak}${this.lineBreak}show link to ${url}`;

            return Markdown.getLinkWithToolTip(title, url, tooltip);
        }

        return `${item.roleDefinition.roleName}`;
    }

    static roleDefinitionCosmosDb(item: AzureRoleAssignmentCosmosDb): string {
        if (item.roleDefinition.typePropertiesType === 'BuiltInRole') {
            const title   = `${item.roleDefinition.roleName}`;
            const url     = `https://learn.microsoft.com/en-us/azure/cosmos-db/role-based-access-control#built-in-roles`;
            const tooltip = '';

            return Markdown.getLinkWithToolTip(title, url, tooltip);
        }

        if (item.roleDefinition.typePropertiesType === 'CustomRole') {
            const title   = `${item.roleDefinition.roleName}`;
            const url     = `https://learn.microsoft.com/en-us/azure/cosmos-db/role-based-access-control#custom-roles`;
            const tooltip = '';

            return Markdown.getLinkWithToolTip(title, url, tooltip);
        }

        return `${item.roleDefinition.roleName}`;
    }

    static managementGroup(item: AzureRoleAssignment): string {
        
        const managementGroupText0
            = `${item.roleAssignment.scope}` === `${item.managementGroupInfo?.id}` && item.managementGroupInfo?.displayName !== undefined
            ? Markdown.getLinkWithToolTip(item.managementGroupInfo?.displayName, AzurePortalLinks.managementGroupOverview(item.managementGroupInfo), `show link to managementGroup '${item.managementGroupInfo.displayName}'`)
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

    static getMermaidDiagramForHierarchy(items: Array<{ container: string | undefined, member: string | undefined }>): string {
        if (items.length === 0) {
            return "nothing to display";
        }

        const id = (value: string | undefined) => Buffer.from(value ?? '').toString('hex');
        const itemToMarkdown = (value: string | undefined) => `${id(value)}["${value}"]`;

        const lines = new Array<string>();

        lines.push('::: mermaid');
        lines.push('graph BT;');
        lines.push('');
        for (const item of items) {
            lines.push(`${itemToMarkdown(item.member)} --> |member of| ${itemToMarkdown(item.container)}`);
        }
        lines.push(':::');


        return lines.join('\n');
    }

    static getMermaidDiagramForHierarchyWithFocus(focus: string[], items: Array<{ container: string | undefined, member: string | undefined }>): string {
        if (items.length === 0) {
            return "nothing to display";
        }

        const id = (value: string | undefined) => Buffer.from(value ?? '').toString('hex');

        // https://rich-iannone.github.io/DiagrammeR/mermaid.html#node-shape-and-text
        const itemToMarkdown = (focus: string[], value: string | undefined) => `${id(value)}${focus.find(p => p === value) === undefined ? '[' : '(('}"${value}"${focus.find(p => p === value) === undefined ? ']' : '))'}`;

        const lines = new Array<string>();

        lines.push('::: mermaid');
        lines.push('graph BT;');
        lines.push('');
        for (const item of items) {
            lines.push(`${itemToMarkdown(focus, item.member)} --> |member of| ${itemToMarkdown(focus, item.container)}`);
        }

        for (const item of focus) {
            lines.push(`style ${id(item)} fill:#00758f`)
        }

        lines.push(':::');


        return lines.join('\n');
    }

    static getMermaidDiagramForHierarchyWithFocusAndLinks(
        focus: string[], 
        items: Array<{ container: string | undefined, member: string | undefined }>,
        links: Array<{ value: string, href: string, target: '_self' | '_blank' | '_parent' | '_top' }>
    ): string {
        if (items.length === 0) {
            return "nothing to display";
        }

        const id = (value: string | undefined) => Buffer.from(value ?? '').toString('hex');

        // https://rich-iannone.github.io/DiagrammeR/mermaid.html#node-shape-and-text
        const itemToMarkdown = (focus: string[], value: string | undefined) => `${id(value)}${focus.find(p => p === value) === undefined ? '[' : '(('}"${value}"${focus.find(p => p === value) === undefined ? ']' : '))'}`;

        const lines = new Array<string>();

        lines.push('::: mermaid');
        lines.push('graph BT;');
        lines.push('');
        for (const item of items) {
            lines.push(`${itemToMarkdown(focus, item.member)} --> |member of| ${itemToMarkdown(focus, item.container)}`);
        }

        lines.push('');
        lines.push('%% ----------------------------------------------------------------');
        lines.push('%% https://mermaid.js.org/syntax/flowchart.html#styling-and-classes');
        lines.push('%% ----------------------------------------------------------------');
        for (const item of focus) {
            lines.push(`style ${id(item)} fill:#00758f`)
        }
        
        lines.push('');
        lines.push('%% --------------------------------------------------------');
        lines.push('%% https://mermaid.js.org/syntax/flowchart.html#interaction');
        lines.push('%% --------------------------------------------------------');
        for (const item of links) {
            lines.push(`click ${id(item.value)} "${item.href}" ${item.target}`)
        }

        lines.push(':::');

        return lines.join('\n');
    }

    static getMermaidDiagramForHierarchyWithStylesAndLinks(
        items : Array<{ container: string | undefined, member: string | undefined }>,
        focus : Array<{ value: string }>, 
        styles: Array<{ value: string, style: string }>, 
        links : Array<{ value: string, href: string, target: '_self' | '_blank' | '_parent' | '_top' }>
    ): string {
        if (items.length === 0) {
            return "nothing to display";
        }

        const id = (value: string | undefined) => Md5.hashStr(value ?? '');

        // https://rich-iannone.github.io/DiagrammeR/mermaid.html#node-shape-and-text
        const itemToMarkdown = (focus: Array<{ value: string }>, value: string | undefined) => `${id(value)}${focus.find(p => p.value === value) === undefined ? '[' : '('}"${value}"${focus.find(p => p.value === value) === undefined ? ']' : ')'}`;

        const lines = new Array<string>();

        lines.push('::: mermaid');
        lines.push('graph BT;');
        lines.push('');
        for (const item of items) {
            lines.push(`${itemToMarkdown(focus, item.member)} --> |member of| ${itemToMarkdown(focus, item.container)}`);
        }

        lines.push('');
        lines.push('%% ----------------------------------------------------------------');
        lines.push('%% https://mermaid.js.org/syntax/flowchart.html#styling-and-classes');
        lines.push('%% ----------------------------------------------------------------');
        for (const item of styles) {
            lines.push('');
            if (item.value !== '') {
                lines.push(`%% ${item.value}`);
                lines.push(`style ${id(item.value)} ${item.style}`);
            }

            if (item.value === '') {
                lines.push(`%% all`);
                lines.push(`classDef default ${item.style}`);
            }
        }
        
        lines.push('');
        lines.push('%% --------------------------------------------------------');
        lines.push('%% https://mermaid.js.org/syntax/flowchart.html#interaction');
        lines.push('%% --------------------------------------------------------');
        for (const item of links) {
            lines.push('');
            lines.push(`%% ${item.value}`);
            lines.push(`click ${id(item.value)} "${item.href}" ${item.target}`)
        }

        lines.push(':::');

        return lines.join('\n');
    }

    static tableKeyValue(keyName: string, valueName: string, items: Array<{ key: string | undefined, value: string | undefined }>): string {
        const lines = new Array<string>();

        lines.push(`|${keyName}|${valueName}|`);
        lines.push('|-|-|');
        for (const item of items) {
            lines.push(`|${item.key}|${item.value}|`);
        }

        return lines.join('\n');
    }

    static table(title:string, headers: Array<string>, collection: Array<Array<string>>): string {
        const lines = new Array<string>();

        lines.push(`# ${title}`);
        lines.push(``);
        lines.push(`|${headers.join('|')}|`);
        lines.push(`|${headers.map(p => '-').join('|')}|`);
        for (const items of collection) {
            lines.push(`|${items.join('|')}|`);
        }

        return lines.join('\n');
    }
}
