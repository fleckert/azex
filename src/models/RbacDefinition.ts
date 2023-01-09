export interface RbacDefinition {
    scope              : string;
    principalId        : string | undefined;
    roleDefinitionId   : string | undefined;
    roleDefinitionName : string | undefined;
    principalType      : string | undefined;
    principalName      : string | undefined;
}
