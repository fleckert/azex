export interface AzureDevOpsAuditLogEntry {
    id                 : string | undefined,
    correlationId      : string | undefined,
    actorUPN           : string | undefined,
    timestamp          : string | undefined,
    scopeType          : string | undefined,
    scopeDisplayName   : string | undefined,
    scopeId            : string | undefined,
    projectId          : string | undefined,
    projectName        : string | undefined,
    actionId           : string | undefined,
    data               : any    | undefined,
    details            : string | undefined,
    area               : string | undefined,
    category           : string | undefined,
    categoryDisplayName: string | undefined,
    actorDisplayName   : string | undefined
}

export interface AzureDevOpsAuditLogEntry_Data_SecurityModifyPermission {
    NamespaceId  : string | undefined,
    NamespaceName: string | undefined,
    Token        : string | undefined,
    EventSummary: [
        {
            permissionNames   : string | undefined
            change            : string | undefined
            subjectDisplayName: string | undefined 
        }
    ] | undefined
}

export interface AzureDevOpsAuditLogEntry_Data_SecurityRemovePermission {
    NamespaceId  : string   | undefined,
    NamespaceName: string   | undefined,
    Token        : string   | undefined,
    Identities   : string[] | undefined
}

export interface AzureDevOpsAuditLogEntry_Data_SecurityRemoveAccessControlLists {
    NamespaceId  : string   | undefined,
    NamespaceName: string   | undefined,
    Tokens       : string[] | undefined,
    Recurse      : boolean  | undefined
}

export interface AzureDevOpsAuditLogEntry_Data_GroupUpdateGroupMembership {
    GroupName        : string | undefined,
    MemberDisplayName: string | undefined
}


export interface AzureDevOpsAuditLogEntry_Data_GroupCreateGroups {
    GroupName        : string | undefined,
}

export interface AzureDevOpsAuditLogEntry_Data_GroupUpdateGroupsModify {
    GroupName        : string | undefined,
    GroupDescription : string | undefined,
    GroupUpdates: [
        {
            DisplayName: string | undefined,
            Description: string | undefined
        }
    ]
}

export interface AzureDevOpsAuditLogEntry_Data_SecurityModifyAccessControlLists {
    NamespaceId  : string | undefined,
    NamespaceName: string | undefined,
    EventSummary: [
        {
            permissionNames   : string | undefined
            change            : string | undefined
            subjectDescriptor : string | undefined
            subjectDisplayName: string | undefined
        }
    ] | undefined
}

export interface AzureDevOpsAuditLogEntry_Data_TokenPatCreateEvent {
    OperationType: string   | undefined
    TokenType    : string   | undefined
    Scopes       : string[] | undefined
    ValidFrom    : string   | undefined
    ValidTo      : string   | undefined
    DisplayName  : string   | undefined
}

export interface AzureDevOpsAuditLogEntry_Data_TokenPatRevokeEvent {
    OperationType: string   | undefined
    TokenType    : string   | undefined
    Scopes       : string[] | undefined
    ValidFrom    : string   | undefined
    ValidTo      : string   | undefined
    DisplayName  : string   | undefined
}

export interface AzureDevOpsAuditLogEntry_Data_ExtensionVersionUpdated {
    PublisherName: string | undefined
    ExtensionName: string | undefined
    Version      : string | undefined
    FromVersion  : string | undefined
}

export interface AzureDevOpsAuditLogEntry_Data_ExtensionInstalled {
    PublisherName: string | undefined
    ExtensionName: string | undefined
    Version      : string | undefined
}

export interface AzureDevOpsAuditLogEntry_Data_ProjectIteration {
    Path       : string | undefined
    ProjectName: string | undefined
}

export interface AzureDevOpsAuditLogEntry_Data_ProjectArea {
    Path       : string | undefined
    ProjectName: string | undefined
}

export interface AzureDevOpsAuditLogEntry_Data_ProjectProcessModify {
    ProcessName   : string | undefined
    OldProcessName: string | undefined
}

export interface AzureDevOpsAuditLogEntry_Data_Licensing {
    UserIdentifier: string | undefined
    AccessLevel   : string | undefined
}

export interface AzureDevOpsAuditLogEntry_Data_LicensingModified {
    UserIdentifier      : string | undefined
    AccessLevel         : string | undefined
    PreviousAccessLevel : string | undefined
}

export interface AzureDevOpsAuditLogEntry_Data_PolicyPolicyConfigModified {
    PolicyTypeDisplayName: string | undefined
    ProjectName          : string | undefined
    RepoName             : string | undefined
    RepoId               : string | undefined
    RefName              : string | undefined
    ConfigProperties: [
        {
            Property: string | undefined
            OldValue: string | undefined
            Value   : string | undefined
        }
    ] | undefined
}

export interface AzureDevOpsAuditLogEntry_Data_PolicyPolicyConfigCreated {
    PolicyTypeDisplayName: string | undefined
    ProjectName          : string | undefined
    RepoName             : string | undefined
    RepoId               : string | undefined
    RefName              : string | undefined
    ConfigProperties: [
        {
            Property: string | undefined
            OldValue: string | undefined
            Value   : string | undefined
        }
    ] | undefined
}

export interface AzureDevOpsAuditLogEntry_Data_PolicyPolicyConfigRemoved {
    PolicyTypeDisplayName: string | undefined
    ProjectName          : string | undefined
    RepoName             : string | undefined
    RepoId               : string | undefined
    RefName              : string | undefined
    ConfigProperties: [
        {
            Property: string | undefined
            OldValue: string | undefined
            Value   : string | undefined
        }
    ] | undefined
}

export class AzureDevOpsAuditLogEntryActionIds {
    static AuditLog_AccessLog                 = "AuditLog.AccessLog"
    static Extension_Installed                = "Extension.Installed"
    static Extension_VersionUpdated           = 'Extension.VersionUpdated'
    static Group_CreateGroups                 = 'Group.CreateGroups';
    static Group_UpdateGroupMembership_Add    = 'Group.UpdateGroupMembership.Add'
    static Group_UpdateGroupMembership_Remove = 'Group.UpdateGroupMembership.Remove'
    static Group_UpdateGroups_Delete          = 'Group.UpdateGroups.Delete'
    static Group_UpdateGroups_Modify          = 'Group.UpdateGroups.Modify';
    static Licensing_Assigned                 = 'Licensing.Assigned'
    static Licensing_Modified                 = 'Licensing.Modified'
    static Licensing_Removed                  = 'Licensing.Removed'
    static Policy_PolicyConfigCreated         = 'Policy.PolicyConfigCreated'
    static Policy_PolicyConfigModified        = 'Policy.PolicyConfigModified'
    static Policy_PolicyConfigRemoved         = 'Policy.PolicyConfigRemoved'
    static Project_AreaPath_Create            = 'Project.AreaPath.Create'
    static Project_AreaPath_Delete            = 'Project.AreaPath.Delete'
    static Project_AreaPath_Update            = 'Project.AreaPath.Update'
    static Project_IterationPath_Create       = 'Project.IterationPath.Create'
    static Project_IterationPath_Delete       = 'Project.IterationPath.Delete'
    static Project_IterationPath_Update       = 'Project.IterationPath.Update'
    static Project_Process_Modify             = 'Project.Process.Modify'
    static Security_ModifyAccessControlLists  = 'Security.ModifyAccessControlLists'
    static Security_ModifyPermission          = 'Security.ModifyPermission'
    static Security_RemovePermission          = 'Security.RemovePermission'
    static Security_RemoveAccessControlLists  = 'Security.RemoveAccessControlLists'
    static Token_PatCreateEvent               = 'Token.PatCreateEvent'
    static Token_PatRevokeEvent               = 'Token.PatRevokeEvent'

}