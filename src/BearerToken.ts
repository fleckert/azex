import { CommandRunner } from "./CommandRunner";
export class BearerToken{
    static azureDevOps    (tenant: string | undefined): Promise<string> { return this.get('499b84ac-1321-427f-aa17-267ca6975798', tenant); }
    static azureManagement(tenant: string | undefined): Promise<string> { return this.get('https://management.core.windows.net' , tenant); }
    static microsoftGraph (tenant: string | undefined): Promise<string> { return this.get('https://graph.microsoft.com'         , tenant); }

    static async get(resource: string, tenant: string | undefined): Promise<string> {
        try { return await BearerTokenAzureCli           .get(resource, tenant); } catch { }
        try { return await BearerTokenAzurePowerShellCore.get(resource, tenant); } catch { }
        try { return await BearerTokenAzurePowerShell    .get(resource, tenant); } catch { }

        throw new Error(`Failed to resolve accessToken resource[${resource}] tenant[${tenant}].`);
    }
}

class BearerTokenAzureCli {
    static async get(resource: string, tenant: string | undefined): Promise<string> {
        const command = `az account get-access-token --resource ${resource} --query accessToken --output tsv ${`${tenant}`.trim() === '' ? '' : `--tenant ${tenant}`}`

        const { stdout, stderr } = await CommandRunner.runAndMap(command, stdOut => stdOut?.trim(), stdErr => stdErr?.trim());

        if (stdout !== undefined && stderr?.length === 0) {
            return stdout;
        }

        throw new Error(`Failed to resolve accessToken [${command}].`);
    }
}

class BearerTokenAzurePowerShell {
    static async get(resource: string, tenant: string | undefined): Promise<string> {
        const command = `powershell -Command "Get-AzAccessToken ${`${tenant}`.trim() === '' ? '' : `-TenantId ${tenant}`} -Resource ${resource} | Select-Object -Expand Token"`

        const { stdout, stderr } = await CommandRunner.runAndMap(command, stdOut => stdOut?.trim(), stdErr => stdErr?.trim());

        if (stdout !== undefined && stderr?.length === 0) {
            return stdout;
        }

        throw new Error(`Failed to resolve accessToken [${command}].`);
    }
}

class BearerTokenAzurePowerShellCore {
    static async get(resource: string, tenant: string | undefined): Promise<string> {
        const command = `pwsh -Command "Get-AzAccessToken ${`${tenant}`.trim() === '' ? '' : `-TenantId ${tenant}`} -Resource ${resource} | Select-Object -Expand Token"`

        const { stdout, stderr } = await CommandRunner.runAndMap(command, stdOut => stdOut?.trim(), stdErr => stdErr?.trim());

        if (stdout !== undefined && stderr?.length === 0) {
            return stdout;
        }

        throw new Error(`Failed to resolve accessToken [${command}].`);
    }
}
