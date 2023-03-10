import path from "path";
import { rbac_extend                 } from "../../../src/CommandHandler/rbac_extend";
import { TestConfigurationProvider   } from "../../_Configuration/TestConfiguration";

test('rbac_extend-min', async () => {
    const credentials  = TestConfigurationProvider.getCredentials();
    const config       = await TestConfigurationProvider.get();
    const subscription = config.subscription;
    const pathIn       = path.join(__dirname, 'out', `azex-test-rbac-export-${subscription}.min.json`);
    const pathOut      = path.join(__dirname, 'out', `azex-test-rbac-extend-min`                            );

    await rbac_extend.handle(credentials, subscription, pathIn, pathOut);
}, 100000);

test('rbac_extend-names', async () => {
    const credentials  = TestConfigurationProvider.getCredentials();
    const config       = await TestConfigurationProvider.get();
    const subscription = config.subscription;
    const pathIn       = path.join(__dirname, 'out', `azex-test-rbac-export-${subscription}.names.json`);
    const pathOut      = path.join(__dirname, 'out', `azex-test-rbac-extend-names`                            );

    await rbac_extend.handle(credentials, subscription, pathIn, pathOut);
}, 100000);
