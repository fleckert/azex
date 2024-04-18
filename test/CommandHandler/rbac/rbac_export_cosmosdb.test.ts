import path from "path";
import { rbac_export_cosmosdb        } from "../../../src/CommandHandler/rbac_export_cosmosdb";
import { TestConfigurationProvider   } from "../../_Configuration/TestConfiguration";

test('rbac_export_cosmosdb', async () => {
    const credentials  = TestConfigurationProvider.getCredentials();
    const config       = await TestConfigurationProvider.get();
    const pathOut      = path.join(__dirname, 'out', `azex-test-rbac-export_cosmosdb`);
    const subscription = config.subscription;

    await rbac_export_cosmosdb.handle(credentials, subscription, pathOut);
}, 100000);
