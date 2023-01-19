import { CommandRunner   } from "./CommandRunner";
import { Guid            } from "./Guid";
import { TokenCredential } from "@azure/identity";
import jwt_decode          from "jwt-decode";

export class TenantIdResolver {
    constructor(readonly credential: TokenCredential) { }

    async getTenantId(): Promise<string | undefined> {
        {
            const tenantId = process.env.AZURE_TENANT_ID;
            if (Guid.isGuid(tenantId)) {
                return tenantId;
            }
        }
        {
            const tenantId = await this.run('az account show --query tenantId --output tsv');
            if (Guid.isGuid(tenantId)) {
                return tenantId;
            }
        }
        {
            const tenantId = await this.run('pwsh -Command "Get-AzContext | Select-Object -Expand Subscription | Select-Object -Expand TenantId"');
            if (Guid.isGuid(tenantId)) {
                return tenantId;
            }
        }
        {
            const tenantId = await this.run('powershell -Command "Get-AzContext | Select-Object -Expand Subscription | Select-Object -Expand TenantId"');
            if (Guid.isGuid(tenantId)) {
                return tenantId;
            }
        }
        {
            const tenantId = await this.getTenantIdFromCredentials(this.credential);
            if (Guid.isGuid(tenantId)) {
                return tenantId;
            }
        }

        return undefined;
    }

    async getTenantIdFromCredentials(credential: TokenCredential): Promise<string | undefined> {
        const token = await credential.getToken("https://management.azure.com/.default");

        if (token === null) {
            return undefined;
        }

        var decoded = jwt_decode<{ tid: string }>(token.token);

        return decoded.tid;
    }

    private async run(command: string): Promise<string | undefined> {
        const { stdout, stderr } = await CommandRunner.runAndMap(command, stdOut => stdOut?.replaceAll('\r', '').replaceAll('\n', ''), stdErr => stdErr);

        return stderr === '' || stderr === undefined ? stdout : undefined;
    }
}
