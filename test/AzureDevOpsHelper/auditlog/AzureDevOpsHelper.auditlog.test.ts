import   path                        from "path";
import { AzureDevOpsHelper         } from "../../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../../_Configuration/TestConfiguration";
import { mkdir, rm, writeFile      } from "fs/promises";

test('AzureDevOpsHelper - auditlog', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenant            = config.azureDevOps.tenant;
    const maxNumberOfTests  = 10??config.azureDevOps.maxNumberOfTests;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);
    const startTime = undefined;
    const endTime = undefined;


    await mkdir(path.join(__dirname, 'out'), { recursive: true });
    const file = path.join(__dirname, 'out', `${organization}-auditlog.json`);
    await rm(file, { force: true });
    const auditlog = await azureDevOpsHelper.auditLog(organization, startTime, endTime, maxNumberOfTests);
    await writeFile(file, JSON.stringify(auditlog, null, 2));


}, 200000);
