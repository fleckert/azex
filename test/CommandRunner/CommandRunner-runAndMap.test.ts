import { CommandRunner } from "../../src/CommandRunner";
import { Guid          } from "../../src/Guid";
import { TestHelper    } from "../_TestHelper/TestHelper";

const testRunAndMap = async (
    command: string,
    mapStdout       : (value: string | undefined) => string | undefined,
    mapStderr       : (value: string | undefined) => string | undefined,
    validationStdout: (value: string | undefined) => boolean,
    validationStderr: (value: string | undefined) => boolean
) => {
    const { stdout, stderr } = await CommandRunner.runAndMap(command, mapStdout, mapStderr);

    const isValidStdout = validationStdout(stdout);
    const isValidStderr = validationStderr(stderr);

    if (isValidStdout === false || isValidStderr === false) {
        throw new Error(JSON.stringify({ command, stdout, isValidStdout, stderr, isValidStderr }, null, 2));
    }

    console.log(JSON.stringify({ command, stdout, isValidStdout, stderr, isValidStderr }, null, 2));
}

test('CommandRunner-runAndMap az account show --query tenantId --output tsv', async () => {
    await testRunAndMap(
        "az account show --query tenantId --output tsv",
        stdout => stdout?.trim(),
        stderr => stderr,
        Guid.isGuid,
        TestHelper.stringIsNullUndefinedOrEmpty,
    );
}, 100000);
