// see https://github.com/Azure/azure-libraries-for-net/blob/master/src/ResourceManagement/ResourceManager/Core/ResourceId.cs
// I translated the file as I couldn't find the functionality in the javaScript SDK

export class AzureResourceId {

    readonly subscriptionId   : string          | undefined;
    readonly resourceGroupName: string          | undefined;
    readonly providerNamespace: string          | undefined;
    readonly resourceType     : string          | undefined;
    readonly name             : string          | undefined;
    readonly parentId         : string          | undefined;
    readonly parentResourceId : AzureResourceId | undefined;

    readonly isValid : boolean;

    
    // Format of id:
    // /subscriptions/<subscriptionId>/resourceGroups/<resourceGroupName>/providers/<providerNamespace>(/<parentResourceType>/<parentName>)*/<resourceType>/<name>
    //  0             1                2              3                   4         5                                                        N-2            N-1
    constructor(readonly id: string) {
        const splits = id.startsWith("/")
                     ? id.substring(1).split('/')
                     : id             .split('/');

        // todo handle starts with /providers/Microsoft.Management/managementGroups


        if (splits.length % 2 == 1) {
            this.isValid = false;
        }
        else if (splits.length < 2) {
            this.isValid = false;
        }
        else if (splits.length === 2) {

        }
        else if (splits.length > 6){
            this.name         = splits[splits.length - 1];
            this.resourceType = splits[splits.length - 2];
        }

        // Extract parentId
        if (splits.length < 10) {
            this.parentId         = undefined;
            this.parentResourceId = undefined;
        }
        else if (splits.length > 6){
            const parentSplits = new Array<string>();
            for (let index = 0; index < splits.length - 2; index++) {
                parentSplits.push(splits[index]);
            }
            this.parentId = "/" + parentSplits.join("/");

            this.parentResourceId = new AzureResourceId(this.parentId);
        }

        for (let index = 0; index < splits.length && index < 6; index++) {
            switch (index) {
                case 0: if (splits[0].toLowerCase() !== "subscriptions" ) { this.isValid = false; }; break;
                case 1: this.subscriptionId    = splits[1]                                         ; break;
                case 2: if (splits[2].toLowerCase() !== "resourcegroups") { this.isValid = false; }; break;
                case 3: this.resourceGroupName = splits[3]                                         ; break;
                case 4: if (splits[4].toLowerCase() !== "providers"     ) { this.isValid = false; }; break;
                case 5: this.providerNamespace = splits[5]                                         ; break;
                default: break;
            }
        }

        this.isValid = true;
    }
}