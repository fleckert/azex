// see https://github.com/Azure/azure-libraries-for-net/blob/master/src/ResourceManagement/ResourceManager/Core/ResourceId.cs
// I translated the file as I couldn't find the functionality in the javaScript SDK

import { Guid } from "./Guid";

export class AzureResourceIdSlim {

    readonly managementGroupName: string | undefined;
    readonly managementGroupId  : string | undefined;
    readonly subscriptionId     : string | undefined;
    readonly resourceGroupName  : string | undefined;
    readonly provider           : string | undefined;
    readonly resource           : string | undefined;

    readonly isValid: boolean;

    stringIsNullUndefinedOrEmpty(value: string | undefined | null) { return value === undefined || value === null || value.length === 0; }


    // Format of id:
    // /subscriptions/<subscriptionId>/resourceGroups/<resourceGroupName>/providers/<providerNamespace>(/<parentResourceType>/<parentName>)*/<resourceType>/<name>
    //  0             1                2              3                   4         5                                                        N-2            N-1
    constructor(readonly id: string) {
        if(id === "/") {
            this.isValid = true
        }
        else if (id.startsWith("/providers/Microsoft.Management/managementGroups/")) {
            const value = id.substring("/providers/Microsoft.Management/managementGroups/".length);

            if (this.stringIsNullUndefinedOrEmpty(value)) {
                this.isValid = false;
            }
            else {
                if (Guid.isGuid(value)) {
                    this.managementGroupId = value;
                }
                else {
                    this.managementGroupName = value;
                }
                this.isValid = true;
            }
        }
        else if (id.startsWith("providers/Microsoft.Management/managementGroups/")) {
            const value = id.substring("providers/Microsoft.Management/managementGroups/".length);

            if (this.stringIsNullUndefinedOrEmpty(value)) {
                this.isValid = false;
            }
            else {
                if (Guid.isGuid(value)) {
                    this.managementGroupId = value;
                }
                else {
                    this.managementGroupName = value;
                }
                this.isValid = true;
            }
        }
        else {
            const splits = id.startsWith("/")
                         ? id.substring(1).split('/')
                         : id.split('/');

            this.subscriptionId    = splits[1];
            this.resourceGroupName = splits[3];
            this.provider          = splits.length > 4 ? splits.slice(5, 7).join('/') : undefined;
            this.resource          = splits.length > 6 ? splits.slice(7   ).join('/') : undefined;

            this.isValid = true;
        }
    }
}