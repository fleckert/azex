import { TenantIdResolver          } from "../../src/TenantIdResolver";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper                } from "../_TestHelper/TestHelper";

test('TenantIdResolver', async () => {
    const credential = TestConfigurationProvider.getCredential();

    const tenantId = await new TenantIdResolver(credential).getTenantId();

    if (TestHelper.stringIsNullUndefinedOrEmpty(tenantId)) {
        throw new Error(`tenantId is null, undefined or empty.`)
    }
}, 100000);
