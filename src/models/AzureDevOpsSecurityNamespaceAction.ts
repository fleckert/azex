
export interface AzureDevOpsSecurityNamespaceAction {
    bit        : number | undefined;
    name       : string | undefined;
    displayName: string | undefined;
    namespaceId: string | undefined;
}

export class AzureDevOpsSecurityNamespaceActionHelper {
    static sort(a: AzureDevOpsSecurityNamespaceAction, b: AzureDevOpsSecurityNamespaceAction) {
        // show these actions first
        const map = (value: string | undefined) => {
            if (value === 'Administer') { return `aaaa`; }
            if (value === 'Contribute') { return `aaab`; }
            if (value === 'Read'      ) { return `aaac`; }

            return `${value}`;
        };

        return map(a.displayName).localeCompare(map(b.displayName));
    }
}
