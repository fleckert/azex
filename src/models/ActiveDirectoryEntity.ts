export type ActiveDirectoryEntityType
= 'Application'
| 'Group' 
| 'ServicePrincipal' 
| 'User';

export interface ActiveDirectoryEntity {
    type       : ActiveDirectoryEntityType;
    id         : string;
    displayName: string;
}

export const ActiveDirectoryEntitySorterByDisplayName = (a: ActiveDirectoryEntity, b: ActiveDirectoryEntity): number => a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase());
