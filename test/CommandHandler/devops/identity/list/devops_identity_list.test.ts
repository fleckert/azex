import   path                        from "path";
import { devops_identity_list      } from "../../../../../src/CommandHandler/devops_identity_list";
import { mkdir                     } from "fs/promises";
import { TestConfigurationProvider } from "../../../../_Configuration/TestConfiguration";

test('devops_identity_list_organization', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const tenantId     = config.azureDevOps.tenantId;

    await mkdir(path.join(__dirname, 'out', organization), { recursive: true });
    const pathOut = path.join(__dirname, 'out', organization, 'devops_identity_list');

    await devops_identity_list.resolve(tenantId, organization, undefined, pathOut);
}, 100000);

test('devops_identity_list_project', async () => {
    
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const projectName  = config.azureDevOps.projectName;
    const tenantId     = config.azureDevOps.tenantId;

    await mkdir(path.join(__dirname, 'out', organization, projectName), { recursive: true });
    const pathOut = path.join(__dirname, 'out', organization, projectName, 'devops_identity_list');

    await devops_identity_list.resolve(tenantId, organization, projectName, pathOut);
}, 100000);
