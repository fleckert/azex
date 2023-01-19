import { TenantIdResolver            } from "../../src/TenantIdResolver";
import { TestHelper                  } from "../TestHelper";
import { TestTokenCredentialProvider } from "../TestTokenCredentialProvider";

 

test('TenantIdResolver', async () => {
    const credential = TestTokenCredentialProvider.get();

    const tenantId = await new TenantIdResolver(credential).getTenantId();

    if (TestHelper.stringIsNullUndefinedOrEmpty(tenantId)) {
        throw new Error(`tenantId is null, undefined or empty.`)
    }
}, 100000);

