export type ActiveDirectoryPrincipalType = 'User' | 'Group' | 'ServicePrincipal'

export interface ActiveDirectoryPrincipal {
    type       : ActiveDirectoryPrincipalType;
    id         : string;
    displayName: string;
}
