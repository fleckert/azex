import { CommandRunner } from "../../src/CommandRunner";
import { TestHelper    } from "../_TestHelper/TestHelper";

const testRun = async (
    command: string,
    validationStdout: (value: string | undefined) => boolean,
    validationStderr: (value: string | undefined) => boolean
) => {
    const { stdout, stderr } = await CommandRunner.run(command);

    const isValidStdout = validationStdout(stdout);
    const isValidStderr = validationStderr(stderr);

    if (isValidStdout === false || isValidStderr === false) {
         throw new Error(JSON.stringify({ command, isValidStdout, isValidStderr, stdout, stderr }, null, 2));
    }

    console.log(JSON.stringify({ command, isValidStdout, isValidStderr, stdout, stderr }, null, 2));
}

test('CommandRunner-run az account show', async () => {
    await testRun("az account show", TestHelper.stringIsNotNullAndNotUndefinedAndNotEmpty, TestHelper.stringIsNullUndefinedOrEmpty);
}, 100000);

test('CommandRunner-run az account showInvalid', async () => {
    await testRun("az account showInvalid", TestHelper.stringIsNullUndefinedOrEmpty, TestHelper.stringIsNotNullAndNotUndefinedAndNotEmpty);
}, 100000);

test('CommandRunner-run az account show --query tenantId --output tsv', async () => {
    await testRun("az account show --query tenantId --output tsv", TestHelper.stringIsNotNullAndNotUndefinedAndNotEmpty, TestHelper.stringIsNullUndefinedOrEmpty);
}, 100000);

