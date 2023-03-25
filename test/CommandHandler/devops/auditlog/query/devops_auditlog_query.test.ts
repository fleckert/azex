import { devops_auditlog_query     } from "../../../../../src/CommandHandler/devops_auditlog_query";
import { TestConfigurationProvider } from "../../../../_Configuration/TestConfiguration";
import { TestHelper                } from "../../../../_TestHelper/TestHelper";

test('devops_auditlog_query', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenant       = config.azureDevOps.tenant;
    const count        = 1000000;

    const pathOut = await TestHelper.prepareFile([__dirname, 'out', organization, 'devops_auditlog_query']);
    
    await devops_auditlog_query.handle(tenant, organization, count, pathOut);
}, 100000);
