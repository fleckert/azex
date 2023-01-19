import { SubscriptionIdResolver } from "../../src/SubscriptionIdResolver";
import { TestHelper             } from "../TestHelper";

test('SubscriptionIdResolver \'undefined\'', async () => {
    const subscriptionId = await new SubscriptionIdResolver().getSubscriptionId(undefined);

    if (TestHelper.stringIsNullUndefinedOrEmpty(subscriptionId)) {
        throw new Error(`subscriptionId is null, undefined or empty.`)
    }
}, 100000);

test('SubscriptionIdResolver \'empty\'', async () => {
    const subscriptionId = await new SubscriptionIdResolver().getSubscriptionId('');

    if (TestHelper.stringIsNullUndefinedOrEmpty(subscriptionId)) {
        throw new Error(`subscriptionId is null, undefined or empty.`)
    }
}, 100000);

test('SubscriptionIdResolver \'guid\'', async () => {
    const guid = 'f49b5658-7600-4f64-9424-4af6e271ca04';
    const subscriptionId = await new SubscriptionIdResolver().getSubscriptionId(guid);

    if (subscriptionId !== guid) {
        throw new Error(`Resolved subscriptionId '${subscriptionId}' does not match expected value '${guid}'.`)
    }
}, 100000);

test('SubscriptionIdResolver \'invalidGuid\'', async () => {
    const guid = 'f49b5658-7600-4f64';
    const subscriptionId = await new SubscriptionIdResolver().getSubscriptionId(guid);

    if (subscriptionId === guid) {
        throw new Error(`Resolved subscriptionId '${subscriptionId}' matches invalid input value '${guid}'.`)
    }
}, 100000);