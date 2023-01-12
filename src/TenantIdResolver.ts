import { exec            } from "child_process";
import { promisify       } from "util";
import { TokenCredential } from "@azure/identity";
import { validate        } from "uuid";
import jwt_decode          from "jwt-decode";

export class TenantIdResolver {
    constructor(readonly credential: TokenCredential) { }

    async getTenantId(): Promise<string | undefined> {
        {
            const tenantId = process.env.AZURE_TENANT_ID;
            if (this.isValidTenantId(tenantId)) {
                return tenantId;
            }
        }
        {
            const tenantId = await this.run('az account show --query tenantId --output tsv');
            if (this.isValidTenantId(tenantId)) {
                return tenantId;
            }
        }
        {
            const tenantId = await this.run('pwsh -Command "Get-AzContext | Select-Object -Expand Subscription | Select-Object -Expand TenantId"');
            if (this.isValidTenantId(tenantId)) {
                return tenantId;
            }
        }
        {
            const tenantId = await this.run('powershell -Command "Get-AzContext | Select-Object -Expand Subscription | Select-Object -Expand TenantId"');
            if (this.isValidTenantId(tenantId)) {
                return tenantId;
            }
        }
        {
            const tenantId = await this.getTenantIdFromCredentials(this.credential);
            if (this.isValidTenantId(tenantId)) {
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

    private isValidTenantId(tenantId: string | undefined) {
        if (tenantId === undefined) { return false; }
        if (tenantId === null     ) { return false; }
        if (tenantId === ''       ) { return false; }

        return validate(tenantId);
    }

    private async run(command: string): Promise<string | undefined> {
        try {
            const { stdout, stderr } = await promisify(exec)(`${command}`);

            return stderr === '' ? stdout.replaceAll('\r', '').replaceAll('\n', '') : undefined;
        } catch (e) {
            return undefined;
        }
    }
}
