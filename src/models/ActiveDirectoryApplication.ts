import { ActiveDirectoryPrincipal } from "./ActiveDirectoryPrincipal";

export interface ActiveDirectoryApplication extends ActiveDirectoryPrincipal {
    appId: string;
}
