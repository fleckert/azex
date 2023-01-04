import { ActiveDirectoryPrincipal } from "./ActiveDirectoryPrincipal";


export interface ActiveDirectoryUser extends ActiveDirectoryPrincipal {
    userPrincipalName: string;
}
