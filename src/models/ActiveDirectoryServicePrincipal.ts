import { ActiveDirectoryPrincipal } from "./ActiveDirectoryPrincipal";


export interface ActiveDirectoryServicePrincipal extends ActiveDirectoryPrincipal {
    appId: string;
    servicePrincipalType: string;
}
