import { ActiveDirectoryEntity } from "./ActiveDirectoryEntity";


export interface ActiveDirectoryServicePrincipal extends ActiveDirectoryEntity {
    appId: string;
    servicePrincipalType: string;
}
