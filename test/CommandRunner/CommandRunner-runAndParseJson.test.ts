import { CommandRunner } from "../../src/CommandRunner";
import { TestHelper    } from "../TestHelper";

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

test('CommandRunner-runAndParseJson az account show', async () => {
    await testRunAndParseJson<{ tenantId: string }, string>(
        "az account show --output json",
        item  => item  !== undefined && item.tenantId !== undefined && item.tenantId.length !== 0,
        TestHelper.stringIsNullUndefinedOrEmpty
    );
}, 100000);

test('CommandRunner-runAndParseJson az account showInvalid', async () => {
    await testRunAndParseJson<{ tenantId: string }, string>(
        "az account showInvalid",
        item  => item  === undefined,
        TestHelper.stringIsNotNullAndNotUndefinedAndNotEmpty
    );
}, 100000);


