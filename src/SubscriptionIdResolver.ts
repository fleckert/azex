import { CommandRunner } from "./CommandRunner";
import { Guid          } from "./Guid";

export class SubscriptionIdResolver {

    async getSubscriptionId(subscriptionId: string | undefined): Promise<string | undefined> {
        {
            const id = subscriptionId;
            if (Guid.isGuid(id)) {
                return id;
            }
        }
        {
            const id = process.env.AZURE_SUBSCRIPTION_ID;
            if (Guid.isGuid(id)) {
                return id;
            }
        }
        {
            const id = await this.run('az account show --query id --output tsv');
            if (Guid.isGuid(id)) {
                return id;
            }
        }
        {
            const id = await this.run('pwsh -Command "Get-AzContext | Select-Object -Expand Subscription | Select-Object -Expand Id"');
            if (Guid.isGuid(id)) {
                return id;
            }
        }
        {
            const id = await this.run('powershell -Command "Get-AzContext | Select-Object -Expand Subscription | Select-Object -Expand Id"');
            if (Guid.isGuid(id)) {
                return id;
            }
        }

        return undefined;
    }

    private async run(command: string): Promise<string | undefined> {
        const { stdout, stderr } = await CommandRunner.runAndMap(command, stdOut => stdOut?.trim(), stdErr => stdErr);

        return stderr === '' || stderr === undefined ? stdout : undefined;
    }
}