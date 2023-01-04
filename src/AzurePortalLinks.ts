import { ManagementGroupInfo } from "@azure/arm-managementgroups";


export class AzurePortalLinks {
    static managementGroupOverview(managementGroupInfo: ManagementGroupInfo): string { return `https://portal.azure.com/#view/Microsoft_Azure_ManagementGroups/ManagmentGroupDrilldownMenuBlade/~/overview/tenantId/${managementGroupInfo.tenantId}/mgId/${managementGroupInfo.name}/mgDisplayName/${managementGroupInfo.displayName}/mgCanAddOrMoveSubscription~/false/mgParentAccessLevel/Not%20Authorized/drillDownMode~/true/defaultMenuItemId/overview`; }
    static subscriptionOverview(tenantId: string, subscriptionId: string): string { return `https://portal.azure.com/#@${tenantId}/resource/subscriptions/${subscriptionId}/overview`; }
    static resourceGroupOverview(tenantId: string, subscriptionId: string, resourceGroupName: string): string { return `https://portal.azure.com/#@${tenantId}/resource/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/overview`; }

    static servicePrincipal(principalId: string, appId: string): string { return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/objectId/${principalId}/appId/${appId}`; }
    static user(principalId: string): string { return `https://portal.azure.com/#view/Microsoft_AAD_IAM/UserDetailsMenuBlade/~/Profile/userId/${principalId}`; }
    static group(principalId: string): string { return `https://portal.azure.com/#view/Microsoft_AAD_IAM/GroupDetailsMenuBlade/~/Overview/groupId/${principalId}`; }
}
