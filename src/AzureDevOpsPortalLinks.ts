
export class AzureDevOpsPortalLinks {
    
    static projectRepositorySettings (organization: string, project: string): string { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?_a=permissions`; }
    

    static repositorySettings        (organization: string, project: string, repositoryId: string): string { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?repo=${repositoryId}`                  ; }
    static repositorySettingsPolicies(organization: string, project: string, repositoryId: string): string { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?repo=${repositoryId}&_a=policiesMid`   ; }
    static repositorySettingsSecurity(organization: string, project: string, repositoryId: string): string { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?repo=${repositoryId}&_a=permissionsMid`; }
}
