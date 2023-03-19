import { CommandRunner } from "./CommandRunner";
export class BearerToken{
    static azureDevOps    (tenant: string | undefined): Promise<string> { return this.get('499b84ac-1321-427f-aa17-267ca6975798', tenant); }
    static azureManagement(tenant: string | undefined): Promise<string> { return this.get('https://management.core.windows.net' , tenant); }
    static microsoftGraph (tenant: string | undefined): Promise<string> { return this.get('https://graph.microsoft.com'         , tenant); }

    static async get(resource: string, tenant: string | undefined): Promise<string> {
        
        const bearerTokenAzureCliPromise            = BearerTokenAzureCli           .get(resource, tenant);
        const bearerTokenAzurePowerShellCorePromise = BearerTokenAzurePowerShellCore.get(resource, tenant);
        const bearerTokenAzurePowerShellPromise     = BearerTokenAzurePowerShell    .get(resource, tenant);
        
        // use try-catch instead of Promise.any to define sequence
        try { return await bearerTokenAzureCliPromise           ; } catch { }
        try { return await bearerTokenAzurePowerShellCorePromise; } catch { }
        try { return await bearerTokenAzurePowerShellPromise    ; } catch { }

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
