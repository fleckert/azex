import { GraphMember } from "azure-devops-node-api/interfaces/GraphInterfaces"

export interface AzureDevOpsMemberEntitlement {
    member: GraphMember
    id: string
    accessLevel: AzureDevOpsMemberEntitlementAccessLevel
    lastAccessedDate: Date
    dateCreated: string
}

export interface AzureDevOpsMemberEntitlementAccessLevel {
    licensingSource: string
    accountLicenseType: string
    msdnLicenseType: string
    licenseDisplayName: string
    status: string
    statusMessage: string
    assignmentSource: string
}
