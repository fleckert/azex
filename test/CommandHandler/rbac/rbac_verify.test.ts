import path from "path";
import { rbac_verify                 } from "../../../src/CommandHandler/rbac_verify";
import { TestConfigurationProvider   } from "../../_Configuration/TestConfiguration";

test('rbac_verify-min', async () => {
    const credentials = TestConfigurationProvider.getCredentials();
    const config      = await TestConfigurationProvider.get()
    const pathIn      = path.join(__dirname, 'out', `azex-test-rbac-export-${config.subscription}.min.json`);
    const pathOut     = path.join(__dirname, 'out', `azex-test-rbac-verify-min`                            );

    await rbac_verify.handle(credentials, config.subscription, pathIn, pathOut);
}, 100000);

test('rbac_verify-ext', async () => {
    const credentials = TestConfigurationProvider.getCredentials();
    const config      = await TestConfigurationProvider.get()
    const pathIn      = path.join(__dirname, 'out', `azex-test-rbac-export-${config.subscription}.ext.json`);
    const pathOut     = path.join(__dirname, 'out', `azex-test-rbac-verify-ext`                            );

    await rbac_verify.handle(credentials, config.subscription, pathIn, pathOut);
}, 100000);
