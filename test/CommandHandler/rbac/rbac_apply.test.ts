import path from "path";
import { rbac_apply                  } from "../../../src/CommandHandler/rbac_apply";
import { TestConfigurationProvider   } from "../../TestConfigurationProvider";
import { TestTokenCredentialProvider } from "../../TestTokenCredentialProvider";

test('rbac_apply-min', async () => {
    const credential = TestTokenCredentialProvider.get();
    const config     = await TestConfigurationProvider.get();
    const pathIn     = path.join(__dirname, 'out', `azex-test-rbac-export-${config.subscription}.min.json`);

    await rbac_apply.handle(credential, config.subscription, pathIn);
}, 100000);

test('rbac_apply-ext', async () => {
    const credential = TestTokenCredentialProvider.get();
    const config     = await TestConfigurationProvider.get();
    const pathIn     = path.join(__dirname, 'out', `azex-test-rbac-export-${config.subscription}.ext.json`);

    await rbac_apply.handle(credential, config.subscription, pathIn);
}, 100000);
