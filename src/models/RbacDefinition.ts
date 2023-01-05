export interface RbacDefinition {
    principalId     : string;
    roleDefinitionId: string;
    scope           : string;
}

export interface RbacDefinitionEx extends RbacDefinition {
    roleDefinitionName  : string | undefined;
    principalType       : string | undefined;
    principalDisplayName: string | undefined;
}
