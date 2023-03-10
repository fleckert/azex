import   path                        from "path";
import { rbac_apply                } from "../../../src/CommandHandler/rbac_apply";
import { TestConfigurationProvider } from "../../_Configuration/TestConfiguration";

test('rbac_apply-min', async () => {
    const credentials = TestConfigurationProvider.getCredentials();
    const config      = await TestConfigurationProvider.get();
    const pathIn      = path.join(__dirname, 'out', `azex-test-rbac-export-${config.subscription}.min.json`);

    await rbac_apply.handle(credentials, config.subscription, pathIn);
}, 100000);

test('rbac_apply-ext', async () => {
    const credentials = TestConfigurationProvider.getCredentials();
    const config      = await TestConfigurationProvider.get();
    const pathIn      = path.join(__dirname, 'out', `azex-test-rbac-export-${config.subscription}.ext.json`);

    await rbac_apply.handle(credentials, config.subscription, pathIn);
}, 100000);
