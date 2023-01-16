import path from "path";
import { rbac_extend                 } from "../../src/CommandHandler/rbac_extend";
import { SubscriptionIdResolver      } from "../../src/SubscriptionIdResolver";
import { TestConfigurationProvider   } from "../TestConfigurationProvider";
import { TestTokenCredentialProvider } from "../TestTokenCredentialProvider";

test('rbac_extend-min', async () => {
    const config = await TestConfigurationProvider.get();
    const credential = TestTokenCredentialProvider.get();

    const subscriptionId = await new SubscriptionIdResolver().getSubscriptionId(config.subscription);
    if (subscriptionId === undefined) { throw new Error("subscriptionId === undefined"); }

    const pathIn  = path.join(__dirname, `azex-test-rbac-export-${subscriptionId}.min.json`);
    const pathOut = path.join(__dirname, `azex-test-rbac-extend-min`                       );

    await rbac_extend.handle(credential, subscriptionId, pathIn, pathOut);
}, 100000);

test('rbac_extend-names', async () => {
    const config = await TestConfigurationProvider.get();
    const credential = TestTokenCredentialProvider.get();

    const subscriptionId = await new SubscriptionIdResolver().getSubscriptionId(config.subscription);
    if (subscriptionId === undefined) { throw new Error("subscriptionId === undefined"); }

    const pathIn  = path.join(__dirname, `azex-test-rbac-export-${subscriptionId}.names.json`);
    const pathOut = path.join(__dirname, `azex-test-rbac-extend-names`                       );

    await rbac_extend.handle(credential, subscriptionId, pathIn, pathOut);
}, 100000);