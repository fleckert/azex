import   path                        from "path";
import { AzureDevOpsHelper         } from "../../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../../_Configuration/TestConfiguration";
import { rm, writeFile             } from "fs/promises";

test('AzureDevOpsHelper - wikis - collection', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenantId          = config.azureDevOps.tenantId;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const testDir           = 'out';
    const testName          = 'wikis-collection';

    const file = path.join(__dirname, testDir, `${testName}-${organization}.json`);
    await rm(file, { force: true });
    const wikis = await azureDevOpsHelper.wikis(organization);
    await writeFile(file, JSON.stringify(wikis, null, 2));
}, 200000);

test('AzureDevOpsHelper - wikis - project', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenantId          = config.azureDevOps.tenantId;
    const projectName       = config.azureDevOps.projectName;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const testDir           = 'out';
    const testName          = 'wikis-collection-project';

    const file = path.join(__dirname, testDir, `${testName}-${organization}-${projectName}.json`);
    await rm(file, { force: true });
    const wikis = await azureDevOpsHelper.wikis(organization, projectName);
    await writeFile(file, JSON.stringify(wikis, null, 2));
}, 100000);

test('AzureDevOpsHelper - wiki - delete', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenantId          = config.azureDevOps.tenantId;
    const projectName       = config.azureDevOps.projectName;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const wikiIdentifier    = '';

    if (`${wikiIdentifier}` !== '') {
        // https://www.sanderh.dev/delete-project-wiki-Azure-DevOps/
        // message: "Wiki delete operation is not supported on wikis of type 'ProjectWiki'.",
        // typeKey: "WikiOperationNotSupportedException",
        await azureDevOpsHelper.wikiDelete(organization, projectName, wikiIdentifier);
    }
}, 100000);

test('AzureDevOpsHelper - wiki - deleteProjectWiki', async () => {

    // https://www.sanderh.dev/delete-project-wiki-Azure-DevOps/

    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenantId          = config.azureDevOps.tenantId;
    const projectName       = config.azureDevOps.projectName;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const manualOnly        = '';

    const wikis = await azureDevOpsHelper.wikis(organization, projectName);

    const repositoryId = wikis.find(p=>`${p.type}` === 'projectWiki')?.repositoryId;

    if (repositoryId !== undefined && `${manualOnly}` === 'reallyReallyReallyDoThis') {
        await azureDevOpsHelper.gitRepositoryDelete(organization, projectName, repositoryId);
    }
}, 100000);