import { exec      } from "child_process";
import { promisify } from "util";


export class SubscriptionIdResolver {

    async getSubscriptionId(subscriptionId: string | undefined): Promise<string | undefined> {
 
        return subscriptionId
            ?? process.env.AZURE_SUBSCRIPTION_ID
            ?? await this.run('az account show --query id --output tsv')
            ?? await this.run('pwsh -Command "Get-AzContext | Select-Object -Expand Subscription | Select-Object -Expand Id"')
            ?? await this.run('powershell -Command "Get-AzContext | Select-Object -Expand Subscription | Select-Object -Expand Id"');
    }

    private async run(command: string): Promise<string | undefined> {
        try {
            const { stdout, stderr } = await promisify(exec)(`${command}`);

            return stderr === '' ? stdout.replaceAll('\r','').replaceAll('\n','') : undefined;
        } catch (e){
            return undefined;
        }
    }
}