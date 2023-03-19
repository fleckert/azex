export interface AzureDevOpsAuditLogEntry {
    id                 : string | undefined,
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