
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
    
    // todo remove whitespace
    static OrganizationAuditLog                 (organization: string) { return `https://dev.azure.com/${organization}/_settings/audit`                }
    static OrganizationProcess                  (organization: string) { return `https://dev.azure.com/${organization}/_settings/process`              }
    static OrganizationConfiguration            (organization: string) { return `https://dev.azure.com/${organization}/_settings/organizationOverview` }
    static OrganizationConfigurationRepositories(organization: string) { return `https://dev.azure.com/${organization}/_settings/repositories`         }
    static OrganizationExtensions               (organization: string) { return `https://dev.azure.com/${organization}/_settings/extensions`           }
    static OrganizationUsers                    (organization: string) { return `https://dev.azure.com/${organization}/_settings/users`                }
    
    static Project                                  (organization: string, project: string                      ) { return `https://dev.azure.com/${organization}/${project}`                                                               }
    static ProjectConfigurationAreas                (organization: string, project: string                      ) { return `https://dev.azure.com/${organization}/${project}/_settings/work?_a=areas`                                       }
    static ProjectConfigurationIterations           (organization: string, project: string                      ) { return `https://dev.azure.com/${organization}/${project}/_settings/work?_a=iterations`                                  }
    static ProjectConfigurationRepositories         (organization: string, project: string                      ) { return `https://dev.azure.com/${organization}/${project}/_settings/repositories`                                        }
    static ProjectConfigurationRepository           (organization: string, project: string, repositoryId: string) { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?repo=${repositoryId}&_a=policiesMid`    }
    static ProjectConfigurationRepositorySecurityAll(organization: string, project: string                      ) { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?_a=permissions`                         }
    static ProjectConfigurationRepositorySecurity   (organization: string, project: string, repositoryId: string) { return `https://dev.azure.com/${organization}/${project}/_settings/repositories?repo=${repositoryId}&_a=permissionsMid` }
    static ProjectDashboards                        (organization: string, project: string                      ) { return `https://dev.azure.com/${organization}/${project}/_dashboards/directory`                                         }
    static ProjectDeliveryPlans                     (organization: string, project: string                      ) { return `https://dev.azure.com/${organization}/${project}/_deliveryplans/plans`                                          }
    static ProjectWorkItemQueryFolders              (organization: string, project: string                      ) { return `https://dev.azure.com/${organization}/${project}/_queries/all/`                                                 }
    static ProjectProcess                           (organization: string, processName: string                  ) { return `https://dev.azure.com/${organization}/_settings/process?process-name=${processName}&_a=workitemtypes`           }
}
