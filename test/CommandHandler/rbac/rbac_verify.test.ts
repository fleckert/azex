import path from "path";
import { rbac_verify                 } from "../../../src/CommandHandler/rbac_verify";
import { TestSubscriptionIdProvider  } from "../../TestSubscriptionIdProvider";
import { TestTokenCredentialProvider } from "../../TestTokenCredentialProvider";

test('rbac_verify-min', async () => {
    const credential     = TestTokenCredentialProvider.get();
    const subscriptionId = await TestSubscriptionIdProvider.getSubscriptionId();
    const pathIn         = path.join(__dirname, 'out', `azex-test-rbac-export-${subscriptionId}.min.json`);
    const pathOut        = path.join(__dirname, 'out', `azex-test-rbac-verify-min`                       );

    await rbac_verify.handle(credential, subscriptionId, pathIn, pathOut);
}, 100000);

test('rbac_verify-ext', async () => {
    const credential     = TestTokenCredentialProvider.get();
    const subscriptionId = await TestSubscriptionIdProvider.getSubscriptionId();
    const pathIn         = path.join(__dirname, 'out', `azex-test-rbac-export-${subscriptionId}.ext.json`);
    const pathOut        = path.join(__dirname, 'out', `azex-test-rbac-verify-ext`                       );

    await rbac_verify.handle(credential, subscriptionId, pathIn, pathOut);
}, 100000);