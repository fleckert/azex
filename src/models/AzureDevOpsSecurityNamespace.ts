import { AzureDevOpsSecurityNamespaceAction } from "./AzureDevOpsSecurityNamespaceAction";


export interface AzureDevOpsSecurityNamespace {
    actions           : AzureDevOpsSecurityNamespaceAction[];
    dataspaceCategory : string  | undefined;
    displayName       : string  | undefined;
    elementLength     : number  | undefined;
    extensionType     : string  | undefined;
    isRemotable       : boolean | undefined;
    name              : string  | undefined;
    namespaceId       : string  | undefined;
    readPermission    : number  | undefined;
    separatorValue    : string  | undefined;
    structureValue    : number  | undefined;
    systemBitMask     : number  | undefined;
    useTokenTranslator: boolean | undefined;
    writePermission   : number  | undefined;
}
