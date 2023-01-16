import path from "path";
import { rbac_verify                 } from "../../src/CommandHandler/rbac_verify";
import { SubscriptionIdResolver      } from "../../src/SubscriptionIdResolver";
import { TestConfigurationProvider   } from "../TestConfigurationProvider";
import { TestTokenCredentialProvider } from "../TestTokenCredentialProvider";

test('rbac_verify-min', async () => {
    const config = await TestConfigurationProvider.get();
    const credential = TestTokenCredentialProvider.get();
    
    const subscriptionId = await new SubscriptionIdResolver().getSubscriptionId(config.subscription);
    if (subscriptionId === undefined) { throw new Error("subscriptionId === undefined"); }
    
    const pathIn  = path.join(__dirname, `azex-test-rbac-export-${subscriptionId}.min.json`);
    const pathOut = path.join(__dirname, `azex-test-rbac-verify-min`                       );

    await rbac_verify.handle(credential, subscriptionId, pathIn, pathOut);
}, 100000);

test('rbac_verify-ext', async () => {
    const config = await TestConfigurationProvider.get();
    const credential = TestTokenCredentialProvider.get();
    
    const subscriptionId = await new SubscriptionIdResolver().getSubscriptionId(config.subscription);
    if (subscriptionId === undefined) { throw new Error("subscriptionId === undefined"); }
    
    const pathIn  = path.join(__dirname, `azex-test-rbac-export-${subscriptionId}.ext.json`);
    const pathOut = path.join(__dirname, `azex-test-rbac-verify-ext`                       );

    await rbac_verify.handle(credential, subscriptionId, pathIn, pathOut);
}, 100000);