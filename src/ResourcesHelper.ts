import { ResourceManagementClient, GenericResource } from "@azure/arm-resources";

export class ResourcesHelper {
    constructor(
        readonly resourceManagementClient: ResourceManagementClient
    ) { }

    async getByIds(resourceIds: Array<string>): Promise<{ items: Array<GenericResource>, failedRequests: Array<string> }> {

        const items = new Array<GenericResource>();
        const failedRequests = new Array<string>();

        for (const resourceId of resourceIds) {
            try {
                const resource = await this.resourceManagementClient.resources.getById(resourceId, "2021-04-01");
                items.push(resource);
            }
            catch {
                failedRequests.push(resourceId);
            }
        }

        return { items, failedRequests };
    }
}