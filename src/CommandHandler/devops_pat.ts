import { BearerToken } from "../BearerToken";

export class devops_pat {
    static async handle(tenant: string): Promise<void> {
        const bearerToken = await BearerToken.azureDevOps(tenant);

        console.log(bearerToken);
    }
}
