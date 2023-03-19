import   path                        from "path";
import { devops_auditlog_query     } from "../../../../../src/CommandHandler/devops_auditlog_query";
import { mkdir                     } from "fs/promises";
import { TestConfigurationProvider } from "../../../../_Configuration/TestConfiguration";

test('devops_auditlog_query', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenant       = config.azureDevOps.tenant;

    await mkdir(path.join(__dirname, 'out', organization), { recursive: true });
    const pathOut = path.join(__dirname, 'out', organization, 'devops_auditlog_query');

    await devops_auditlog_query.handle(tenant, organization, pathOut);
}, 100000);

