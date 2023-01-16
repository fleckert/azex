import path from "path";
import { rbac_export                 } from "../../src/CommandHandler/rbac_export";
import { SubscriptionIdResolver      } from "../../src/SubscriptionIdResolver";
import { TestConfigurationProvider   } from "../TestConfigurationProvider";
import { TestTokenCredentialProvider } from "../TestTokenCredentialProvider";


test('rbac_export', async () => {
    const config = await TestConfigurationProvider.get();
    const credential = TestTokenCredentialProvider.get();
    
    const subscriptionId = await new SubscriptionIdResolver().getSubscriptionId(config.subscription);
    if (subscriptionId === undefined) { throw new Error("subscriptionId === undefined"); }
    
    const pathOut = path.join(__dirname, `azex-test-rbac-export`);

    await rbac_export.handle(credential, subscriptionId, pathOut);
}, 100000);
