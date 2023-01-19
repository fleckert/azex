import { CommandRunner } from "../../src/CommandRunner";
import { validate      } from "uuid";

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

const testRunAndMap = async (
    command: string,
    mapStdout       : (value: string | undefined) => string | undefined,
    mapStderr       : (value: string | undefined) => string | undefined,
    validationStdout: (value: string | undefined) => boolean,
    validationStderr: (value: string | undefined) => boolean
) => {
    const { stdout, stderr } = await CommandRunner.run(command);

    const stdoutMapped = mapStdout(stdout);
    const stderrMapped = mapStderr(stderr);

    const isValidStdout = validationStdout(stdoutMapped);
    const isValidStderr = validationStderr(stderrMapped);

    if (isValidStdout === false || isValidStderr === false) {
        throw new Error(JSON.stringify({ command, stdout, stdoutMapped, isValidStdout, stderr, stderrMapped, isValidStderr }, null, 2));
    }

    console.log(JSON.stringify({ command, stdout, stdoutMapped, isValidStdout, stderr, stderrMapped, isValidStderr }, null, 2));
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

const stringIsNullUndefinedOrEmpty              = (value: string | undefined | null) => { return value === undefined || value === null || value.length === 0; }
const stringIsNotNullAndNotUndefinedAndNotEmpty = (value: string | undefined | null) => { return value !== undefined && value !== null && value.length !== 0; }

test('CommandRunner-testRun az account show', async () => {
    await testRun("az account show", stringIsNotNullAndNotUndefinedAndNotEmpty, stringIsNullUndefinedOrEmpty);
}, 100000);

test('CommandRunner-testRun az account showInvalid', async () => {
    await testRun("az account showInvalid", stringIsNullUndefinedOrEmpty, stringIsNotNullAndNotUndefinedAndNotEmpty);
}, 100000);

test('CommandRunner-testRun az account show --query tenantId --output tsv', async () => {
    await testRun("az account show --query tenantId --output tsv", stringIsNotNullAndNotUndefinedAndNotEmpty, stringIsNullUndefinedOrEmpty);
}, 100000);

test('CommandRunner-testRunAndMap az account show --query tenantId --output tsv', async () => {
    await testRunAndMap(
        "az account show --query tenantId --output tsv",
        stdout => stdout?.replaceAll('\r', '')?.replaceAll('\n', ''),
        stderr => stderr,
        stdout => stdout !== undefined && validate(stdout),
        stringIsNullUndefinedOrEmpty,
    );
}, 100000);


test('CommandRunner-testRunAndParseJson az account show', async () => {
    await testRunAndParseJson<{ tenantId: string }, string>(
        "az account show --output json",
        item  => item  !== undefined && item.tenantId !== undefined && item.tenantId.length !== 0,
        stringIsNullUndefinedOrEmpty
    );
}, 100000);

test('CommandRunner-testRunAndParseJson az account showInvalid', async () => {
    await testRunAndParseJson<{ tenantId: string }, string>(
        "az account showInvalid",
        item  => item  === undefined,
        stringIsNotNullAndNotUndefinedAndNotEmpty
    );
}, 100000);


