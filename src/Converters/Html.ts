import { AzurePortalLinks                           } from "../AzurePortalLinks";
import { ActiveDirectoryGroup                       } from "../models/ActiveDirectoryGroup";
import { ActiveDirectoryServicePrincipal            } from "../models/ActiveDirectoryServicePrincipal";
import { ActiveDirectoryUser                        } from "../models/ActiveDirectoryUser";
import { AzureRoleAssignment, AzureRoleAssignmentEx } from "../models/AzureRoleAssignment";
import { RoleAssignmentHelper } from "../RoleAssignmentHelper";

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
        return `<a href="${url}" title="${tooltip}" target="_blank">${title}</a>`;
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
        lines.push('    <div class="mermaid">');
        lines.push('        graph BT;');
        lines.push('        ');
        
        for (const item of items) {
            lines.push(`            ${itemToMarkdown(item.member)} --> |member of| ${itemToMarkdown(item.container)}`);
        }
        lines.push('    </div>');
        lines.push('</body>');
        lines.push('</html>');

        return lines.join('\n');
    }
}
