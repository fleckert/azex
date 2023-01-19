import path from "path";
import { rbac_extend                 } from "../../../src/CommandHandler/rbac_extend";
import { TestSubscriptionIdProvider  } from "../../TestSubscriptionIdProvider";
import { TestTokenCredentialProvider } from "../../TestTokenCredentialProvider";

test('rbac_extend-min', async () => {
    const credential     = TestTokenCredentialProvider.get();
    const subscriptionId = await TestSubscriptionIdProvider.getSubscriptionId();
    const pathIn         = path.join(__dirname, 'out', `azex-test-rbac-export-${subscriptionId}.min.json`);
    const pathOut        = path.join(__dirname, 'out', `azex-test-rbac-extend-min`                       );

    await rbac_extend.handle(credential, subscriptionId, pathIn, pathOut);
}, 100000);

test('rbac_extend-names', async () => {
    const credential     = TestTokenCredentialProvider.get();
    const subscriptionId = await TestSubscriptionIdProvider.getSubscriptionId();
    const pathIn         = path.join(__dirname, 'out', `azex-test-rbac-export-${subscriptionId}.names.json`);
    const pathOut        = path.join(__dirname, 'out', `azex-test-rbac-extend-names`                       );

    await rbac_extend.handle(credential, subscriptionId, pathIn, pathOut);
}, 100000);