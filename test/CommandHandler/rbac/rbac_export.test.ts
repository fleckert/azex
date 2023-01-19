import path from "path";
import { rbac_export                 } from "../../../src/CommandHandler/rbac_export";
import { TestTokenCredentialProvider } from "../../TestTokenCredentialProvider";
import { TestSubscriptionIdProvider  } from "../../TestSubscriptionIdProvider";


test('rbac_export', async () => {
    const credential     = TestTokenCredentialProvider.get();
    const subscriptionId = await TestSubscriptionIdProvider.getSubscriptionId();
    const pathOut        = path.join(__dirname, 'out', `azex-test-rbac-export`);

    await rbac_export.handle(credential, subscriptionId, pathOut);
}, 100000);
