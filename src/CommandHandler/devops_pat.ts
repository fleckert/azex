import { BearerToken } from "../BearerToken";

export class devops_pat {
    static async handle(tenantId: string): Promise<void> {
        const bearerToken = await BearerToken.azureDevOps(tenantId);

        console.log(bearerToken);
    }
}
