import path from "path";
import { rbac_verify                 } from "../../../src/CommandHandler/rbac_verify";
import { TestConfigurationProvider   } from "../../TestConfigurationProvider";
import { TestTokenCredentialProvider } from "../../TestTokenCredentialProvider";

test('rbac_verify-min', async () => {
    const credential = TestTokenCredentialProvider.get();
    const config     = await TestConfigurationProvider.get()
    const pathIn     = path.join(__dirname, 'out', `azex-test-rbac-export-${config.subscription}.min.json`);
    const pathOut    = path.join(__dirname, 'out', `azex-test-rbac-verify-min`                            );

    await rbac_verify.handle(credential, config.subscription, pathIn, pathOut);
}, 100000);

test('rbac_verify-ext', async () => {
    const credential = TestTokenCredentialProvider.get();
    const config     = await TestConfigurationProvider.get()
    const pathIn     = path.join(__dirname, 'out', `azex-test-rbac-export-${config.subscription}.ext.json`);
    const pathOut    = path.join(__dirname, 'out', `azex-test-rbac-verify-ext`                            );

    await rbac_verify.handle(credential, config.subscription, pathIn, pathOut);
}, 100000);