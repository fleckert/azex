
export class AzureDevOpsPortalLinks {
    
    static projectRepositorySettings (organization: string, project: string): string { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?_a=permissions`; }
    

    static repositorySettings        (organization: string, project: string, repositoryId: string): string { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?repo=${repositoryId}`                  ; }
    static repositorySettingsPolicies(organization: string, project: string, repositoryId: string): string { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?repo=${repositoryId}&_a=policiesMid`   ; }
    static repositorySettingsSecurity(organization: string, project: string, repositoryId: string): string { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?repo=${repositoryId}&_a=permissionsMid`; }

    static Permissions(organization: string, project?: string, subjectDescriptor?: string) { return `https://dev.azure.com/${organization}/${project === undefined ? '' : `${project}/`}_settings/permissions${subjectDescriptor === undefined ? '' : `?subjectDescriptor=${subjectDescriptor}`}` } 
    //https://dev.azure.com/lseg/Foundation/_settings/permissions?subjectDescriptor=vssgp.Uy0xLTktMTU1MTM3NDI0NS0xMzU5MTA3Nzg5LTQxODU5NzIwNDctMjQzMzE3ODc2Ni04NDczMTQ3NTItMS0xNDQxNjQ0NDgtMjAzODU2NjIxOS0yODQwMjE3MTIwLTMxNDgxNDc4NDQ
}
