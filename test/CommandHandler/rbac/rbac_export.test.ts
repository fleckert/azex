import path from "path";
import { rbac_export                 } from "../../../src/CommandHandler/rbac_export";
import { TestConfigurationProvider   } from "../../TestConfigurationProvider";

test('rbac_export', async () => {
    const credential = TestConfigurationProvider.getCredential();
    const config     = await TestConfigurationProvider.get();
    const pathOut    = path.join(__dirname, 'out', `azex-test-rbac-export`);

    await rbac_export.handle(credential, config.subscription, pathOut);
}, 100000);
