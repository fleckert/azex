import path from "path";
import { rbac_extend                 } from "../../../src/CommandHandler/rbac_extend";
import { TestConfigurationProvider   } from "../../_Configuration/TestConfiguration";

test('rbac_extend-min', async () => {
    const credential = TestConfigurationProvider.getCredential();
    const config     = await TestConfigurationProvider.get();
    const pathIn     = path.join(__dirname, 'out', `azex-test-rbac-export-${config.subscription}.min.json`);
    const pathOut    = path.join(__dirname, 'out', `azex-test-rbac-extend-min`                            );

    await rbac_extend.handle(credential, config.subscription, pathIn, pathOut);
}, 100000);

test('rbac_extend-names', async () => {
    const credential = TestConfigurationProvider.getCredential();
    const config     = await TestConfigurationProvider.get();
    const pathIn     = path.join(__dirname, 'out', `azex-test-rbac-export-${config.subscription}.names.json`);
    const pathOut    = path.join(__dirname, 'out', `azex-test-rbac-extend-names`                            );

    await rbac_extend.handle(credential, config.subscription, pathIn, pathOut);
}, 100000);
