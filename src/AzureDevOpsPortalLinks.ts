
export class AzureDevOpsPortalLinks {
    
    static projectRepositorySettings (organization: string, project: string): string { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?_a=permissions`; }
    

    static repositorySettings        (organization: string, project: string, repositoryId: string): string { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?repo=${repositoryId}`                  ; }
    static repositorySettingsPolicies(organization: string, project: string, repositoryId: string): string { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?repo=${repositoryId}&_a=policiesMid`   ; }
    static repositorySettingsSecurity(organization: string, project: string, repositoryId: string): string { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?repo=${repositoryId}&_a=permissionsMid`; }

    static Permissions(organization: string, project: string | undefined, subjectDescriptor: string | undefined) {
        return `https://dev.azure.com/${organization}/`
            + (project === undefined ? '' : `${project.replaceAll(' ', '%20')}/`)
            + `_settings/permissions`
            + (subjectDescriptor === undefined ? '' : `?subjectDescriptor=${subjectDescriptor}`);
    }

    static ProjectConfigurationAreas     (organization: string, project: string) { return `https://dev.azure.com/${organization}/${project}/_settings/work?_a=areas`      }
    static ProjectConfigurationIterations(organization: string, project: string) { return `https://dev.azure.com/${organization}/${project}/_settings/work?_a=iterations` }
}
