export type ActiveDirectoryPrincipalType = 'User' | 'Group' | 'ServicePrincipal' | 'Application';

export interface ActiveDirectoryPrincipal {
    type       : ActiveDirectoryPrincipalType;
    id         : string;
    displayName: string;
}
