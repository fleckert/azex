import { ActiveDirectoryEntity } from "./ActiveDirectoryEntity";


export interface ActiveDirectoryUser extends ActiveDirectoryEntity {
    userPrincipalName: string;
}

export const ActiveDirectoryUserSorterByUserPrincipalName = (a: ActiveDirectoryUser, b: ActiveDirectoryUser) => a.userPrincipalName.toLowerCase().localeCompare(b.userPrincipalName.toLowerCase());