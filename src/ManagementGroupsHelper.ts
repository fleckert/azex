import { ManagementGroupInfo, ManagementGroupsAPI } from "@azure/arm-managementgroups";
import { TokenCredential                          } from "@azure/identity";

export class ManagementGroupsHelper {
    readonly managementGroupsAPI: ManagementGroupsAPI;

    constructor(
        readonly credential: TokenCredential
    ) {
        this.managementGroupsAPI = new ManagementGroupsAPI(credential);
    }

    async getByIds(groupIds: string[]): Promise<Array<ManagementGroupInfo>> {
        // this.managementGroupsAPI.managementGroups.get(p) causes authentication errors

        const managementGroupInfos = new Array<ManagementGroupInfo>();

        try {
            const managementGroupInfoIterator = this.managementGroupsAPI.managementGroups.list();

            for await (const managementGroupInfo of managementGroupInfoIterator) {
                if (groupIds.find(p => managementGroupInfo.id?.toLowerCase() === p.toLowerCase()) !== undefined) {
                    managementGroupInfos.push(managementGroupInfo);
                }
            }
        }
        catch (e: any) {
            if (e?.statusCode === 403) {
                // 'The client '...' with object id '...' does not have authorization to perform action
                // 'Microsoft.Management/managementGroups/read' over scope '/providers/Microsoft.Management' or the scope is invalid.
                // If access was recently granted, please refresh your credentials.'
            }
            else if (e?.statusCode === 404) {
                // 'Management Groups are not enabled in this tenant.'
            }
            else {
                throw e;
            }
        }

        return managementGroupInfos;
    }
}