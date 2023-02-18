
// https://learn.microsoft.com/en-us/rest/api/azure/devops/security/access-control-lists/query?view=azure-devops-rest-7.1&tabs=HTTP#accesscontrolentry
export interface AzureDevOpsAccessControlEntry {
    allow     : number | undefined;
    deny      : number | undefined;
    descriptor: string | undefined;
    // https://learn.microsoft.com/en-us/rest/api/azure/devops/security/access-control-lists/query?view=azure-devops-rest-7.1&tabs=HTTP#aceextendedinformation
    extendedInfo: {
        inheritedAllow: number | undefined,
        effectiveAllow: number | undefined,
        inheritedDeny : number | undefined,
        effectiveDeny : number | undefined,
    } | undefined;
}

// https://learn.microsoft.com/en-us/rest/api/azure/devops/security/access-control-lists/query?view=azure-devops-rest-7.1&tabs=HTTP#accesscontrollist
export interface AzureDevOpsAccessControlList {
    acesDictionary     : { [id: string] : AzureDevOpsAccessControlEntry } | undefined;
    inheritPermissions : boolean | undefined;
    includeExtendedInfo: boolean | undefined; 
    token              : string  | undefined;
}

export class AzureDevOpsAccessControlListHelper {
    static getIdentityDescriptors(accessControlLists: AzureDevOpsAccessControlList[]): string[] {
        const identityDescriptors = new Set<string>();

        for (const accessControlList of accessControlLists) {
            for (const key in accessControlList.acesDictionary) {
                const identity = accessControlList.acesDictionary[key];
                if (identity.descriptor === undefined) {
                    continue;
                }
                identityDescriptors.add(identity.descriptor);
            }
        }

        const identityDescriptorsArray = [...identityDescriptors].sort();

        return identityDescriptorsArray;
    }
}