import path from "path";
import { rbac_verify                 } from "../../../src/CommandHandler/rbac_verify";
import { TestConfigurationProvider   } from "../../TestConfigurationProvider";

test('rbac_verify-min', async () => {
    const credential = TestConfigurationProvider.getCredential();
    const config     = await TestConfigurationProvider.get()
    const pathIn     = path.join(__dirname, 'out', `azex-test-rbac-export-${config.subscription}.min.json`);
    const pathOut    = path.join(__dirname, 'out', `azex-test-rbac-verify-min`                            );

    await rbac_verify.handle(credential, config.subscription, pathIn, pathOut);
}, 100000);

test('rbac_verify-ext', async () => {
    const credential = TestConfigurationProvider.getCredential();
    const config     = await TestConfigurationProvider.get()
    const pathIn     = path.join(__dirname, 'out', `azex-test-rbac-export-${config.subscription}.ext.json`);
    const pathOut    = path.join(__dirname, 'out', `azex-test-rbac-verify-ext`                            );

    await rbac_verify.handle(credential, config.subscription, pathIn, pathOut);
}, 100000);
