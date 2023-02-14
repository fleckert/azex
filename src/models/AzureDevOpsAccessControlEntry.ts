
export interface AzureDevOpsAccessControlEntry {
    allow     : number | undefined;
    deny      : number | undefined;
    descriptor: number | undefined;
}

export interface AzureDevOpsAccessControlList {
    acesDictionary     : { [id: string] : AzureDevOpsAccessControlEntry } | undefined;
    inheritPermissions : boolean | undefined;
    includeExtendedInfo: boolean | undefined; 
    token              : string  | undefined;
}
