
export class AzureDevOpsPortalLinks {
    static repositorySettings        (organization: string, project: string, repositoryId: string): string { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?repo=${repositoryId}`                  ; }
    static repositorySettingsPolicies(organization: string, project: string, repositoryId: string): string { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?repo=${repositoryId}&_a=policiesMid`   ; }
    static repositorySettingsSecurity(organization: string, project: string, repositoryId: string): string { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?repo=${repositoryId}&_a=permissionsMid`; }
}
