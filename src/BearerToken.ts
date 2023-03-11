import { CommandRunner } from "./CommandRunner";

export class BearerToken {
    static devOps(tenantId: string | undefined): Promise<string> {
        return this.get('499b84ac-1321-427f-aa17-267ca6975798', tenantId);
    }

    static async get(resource:string, tenantId: string | undefined): Promise<string> {
        const command = `az account get-access-token --resource ${resource} --query accessToken --output tsv ${`${tenantId}`.trim() === '' ? '' : `--tenant ${tenantId}`}`

        const { stdout, stderr } = await CommandRunner.runAndMap(command, stdOut => stdOut?.trim(), stdErr => stdErr?.trim());

        if (stdout !== undefined && stderr?.length === 0) {
            return stdout;
        }

        throw new Error(`Failed to resolve accessToken [${command}].`);
    }
}
