import path from "path";
import { rbac_export                 } from "../../../src/CommandHandler/rbac_export";
import { TestConfigurationProvider   } from "../../_Configuration/TestConfiguration";

test('rbac_export', async () => {
    const credentials  = TestConfigurationProvider.getCredentials();
    const config       = await TestConfigurationProvider.get();
    const pathOut      = path.join(__dirname, 'out', `azex-test-rbac-export`);
    const subscription = config.subscription;

    await rbac_export.handle(credentials, subscription, pathOut);
}, 100000);
