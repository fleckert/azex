export class az_devops_security_permission {
    static showDocs() { return 'https://learn.microsoft.com/en-us/cli/azure/devops/security/permission?view=azure-cli-latest#az-devops-security-permission-show'; }
    static show(organization: string, securityNamespaceId: string, subjectDescriptor: string, token: string) {
        return 'az devops security permission show' +
            ` --organization 'https://dev.azure.com/${organization}' --detect false --output table` +
            ` --id '${securityNamespaceId}'` +
            ` --token '${token}'` +
            ` --subject '${subjectDescriptor}'`;
    }

    static resetDocs() { return 'https://learn.microsoft.com/en-us/cli/azure/devops/security/permission?view=azure-cli-latest#az-devops-security-permission-reset'; }
    static reset(organization: string, securityNamespaceId: string, subjectDescriptor: string, token: string, permissionBit: string) {
        return 'az devops security permission reset' +
            ` --organization 'https://dev.azure.com/${organization}' --detect false --output table` +
            ` --id '${securityNamespaceId}'` +
            ` --token '${token}'` +
            ` --subject '${subjectDescriptor}'` +
            ` --permission-bit ${permissionBit}`;
    }

    static updateDocs() { return 'https://learn.microsoft.com/en-us/cli/azure/devops/security/permission?view=azure-cli-latest#az-devops-security-permission-update'; }
    static update(organization: string, securityNamespaceId: string, subjectDescriptor: string, token: string, allowBit: string, denyBit: string, merge:string) {
        return 'az devops security permission update' +
            ` --organization 'https://dev.azure.com/${organization}' --detect false --output table` +
            ` --id '${securityNamespaceId}'` +
            ` --token '${token}'` +
            ` --subject '${subjectDescriptor}'` +
            ` --allow-bit ${allowBit}` +
            ` --deny-bit ${denyBit}` +
            ` --merge ${merge}`;
    }
}