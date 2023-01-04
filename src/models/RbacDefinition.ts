export interface RbacDefinition {
    principalId     : string;
    roleDefinitionId: string;
    scope           : string;
}

export interface RbacDefinitionWithLocality extends RbacDefinition {
    isPlanned: boolean | undefined;
    exists   : boolean | undefined;
}
