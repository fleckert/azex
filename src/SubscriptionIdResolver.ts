import { exec      } from "child_process";
import { promisify } from "util";
import { validate  } from "uuid";

export class SubscriptionIdResolver {

    async getSubscriptionId(subscriptionId: string | undefined): Promise<string | undefined> {
        {
            const id = subscriptionId;
            if (this.isValidSubscriptionId(id)) {
                return id;
            }
        }
        {
            const id = process.env.AZURE_SUBSCRIPTION_ID;
            if (this.isValidSubscriptionId(id)) {
                return id;
            }
        }
        {
            const id = await this.run('az account show --query id --output tsv');
            if (this.isValidSubscriptionId(id)) {
                return id;
            }
        }
        {
            const id = await this.run('pwsh -Command "Get-AzContext | Select-Object -Expand Subscription | Select-Object -Expand Id"');
            if (this.isValidSubscriptionId(id)) {
                return id;
            }
        }
        {
            const id = await this.run('powershell -Command "Get-AzContext | Select-Object -Expand Subscription | Select-Object -Expand Id"');
            if (this.isValidSubscriptionId(id)) {
                return id;
            }
        }

        return undefined;
    }

    private async run(command: string): Promise<string | undefined> {
        try {
            const { stdout, stderr } = await promisify(exec)(`${command}`);

            return stderr === '' ? stdout.replaceAll('\r','').replaceAll('\n','') : undefined;
        } catch (e){
            return undefined;
        }
    }

    private isValidSubscriptionId(tenantId: string | undefined) {
        if (tenantId === undefined) { return false; }
        if (tenantId === null     ) { return false; }
        if (tenantId === ''       ) { return false; }

        return validate(tenantId);
    }
}