import path from "path";
import { rbac_apply                  } from "../../../src/CommandHandler/rbac_apply";
import { SubscriptionIdResolver      } from "../../../src/SubscriptionIdResolver";
import { TestConfigurationProvider   } from "../../TestConfigurationProvider";
import { TestTokenCredentialProvider } from "../../TestTokenCredentialProvider";

test('rbac_apply-min', async () => {
    const config = await TestConfigurationProvider.get();
    const credential = TestTokenCredentialProvider.get();

    const subscriptionId = await new SubscriptionIdResolver().getSubscriptionId(config.subscription);
    if (subscriptionId === undefined) { throw new Error("subscriptionId === undefined"); }

    const pathIn = path.join(__dirname, 'out',`azex-test-rbac-export-${subscriptionId}.min.json`);

    await rbac_apply.handle(credential, subscriptionId, pathIn);
}, 100000);

test('rbac_apply-ext', async () => {
    const config = await TestConfigurationProvider.get();
    const credential = TestTokenCredentialProvider.get();

    const subscriptionId = await new SubscriptionIdResolver().getSubscriptionId(config.subscription);
    if (subscriptionId === undefined) { throw new Error("subscriptionId === undefined"); }

    const pathIn = path.join(__dirname, 'out',`azex-test-rbac-export-${subscriptionId}.ext.json`);

    await rbac_apply.handle(credential, subscriptionId, pathIn);
}, 100000);