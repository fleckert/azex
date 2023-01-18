import { exec } from "child_process";
import { promisify } from "util";

export class CommandRunner {

    static async run(command: string): Promise<{ stdout: string | undefined, stderr: string | undefined }> {

        try {
            const { stdout, stderr } = await promisify(exec)(command);

            return { stdout, stderr };
        }
        catch (e: any) {
            return { stdout: undefined, stderr: e.message };
        }
    }

    static async runAndParseJson<TItem, TError>(command: string): Promise<{ item: TItem | undefined, error: TError | undefined }> {
        const { stdout, stderr } = await this.run(command)

        if (stderr !== undefined && stderr?.length !== 0) {
            return { item: undefined, error: stderr.startsWith('{') || stderr.startsWith('[') ? JSON.parse(stderr) : stderr };
        }

        if (stdout !== undefined && stdout?.length !== 0) {
            return { item: JSON.parse(stdout), error: undefined };
        }

        return { item: undefined, error: undefined };
    }
}
