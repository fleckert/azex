import { CommandRunner } from "../../src/CommandRunner";

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

const testRunAndParseJson = async <TItem, TError>(
    command        : string,
    validationItem : (value: TItem  | undefined) => boolean,
    validationError: (value: TError | undefined) => boolean
) => {
    const { item, error } = await CommandRunner.runAndParseJson<TItem, TError>(command);

    const isValidItem  = validationItem (item );
    const isValidError = validationError(error);

    if (isValidItem === false || isValidError === false) {
         throw new Error(JSON.stringify({ command, isValidItem, isValidError, item, error }, null, 2));
    }

    console.log(JSON.stringify({ command, isValidItem, isValidError, item, error }, null, 2));
}


test('CommandRunner-testRun az account show', async () => {
    await testRun(
        "az account show",
        stdout => stdout !== undefined && stdout.length > 0,
        stderr => stderr === undefined || stderr.length === 0
    );
}, 100000);

test('CommandRunner-testRun az account show --query tenantId --output tsv', async () => {
    await testRun(
        "az account show --query tenantId --output tsv",
        stdout => stdout !== undefined && stdout.length > 0,
        stderr => stderr === undefined || stderr.length === 0
    );
}, 100000);


test('CommandRunner-testRunAndParseJson az account show', async () => {
    await testRunAndParseJson<{ tenantId: string }, string>(
        "az account show",
        item  => item  !== undefined && item.tenantId !== undefined && item.tenantId.length > 0,
        error => error === undefined || error.length === 0
    );
}, 100000);

test('CommandRunner-testRunAndParseJson az account showInvalid', async () => {
    await testRunAndParseJson<{ tenantId: string }, string>(
        "az account showInvalid",
        item  => item  === undefined,
        error => error !== undefined && error.length > 0
    );
}, 100000);


