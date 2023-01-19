import path from "path";
import { rbac_apply                  } from "../../../src/CommandHandler/rbac_apply";
import { TestSubscriptionIdProvider  } from "../../TestSubscriptionIdProvider";
import { TestTokenCredentialProvider } from "../../TestTokenCredentialProvider";

test('rbac_apply-min', async () => {
    const credential     = TestTokenCredentialProvider.get();
    const subscriptionId = await TestSubscriptionIdProvider.getSubscriptionId();
    const pathIn         = path.join(__dirname, 'out', `azex-test-rbac-export-${subscriptionId}.min.json`);

    await rbac_apply.handle(credential, subscriptionId, pathIn);
}, 100000);

test('rbac_apply-ext', async () => {
    const credential     = TestTokenCredentialProvider.get();
    const subscriptionId = await TestSubscriptionIdProvider.getSubscriptionId();
    const pathIn         = path.join(__dirname, 'out', `azex-test-rbac-export-${subscriptionId}.ext.json`);

    await rbac_apply.handle(credential, subscriptionId, pathIn);
}, 100000);
