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
                if (groupIds.filter(p => managementGroupInfo.id === p)[0] !== undefined) {
                    managementGroupInfos.push(managementGroupInfo);
                }
            }
        }
        catch (e: any) {
            if (e?.statusCode === 404) {
                // [{"error":{"code":"NotFound","message":"Management Groups are not enabled in this tenant.","details":null}}]
            }
            else {
                throw e;
            }
        }

        return managementGroupInfos;
    }
}