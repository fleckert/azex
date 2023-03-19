import   path                        from "path";
import { devops_permissions_token  } from "../../../../../src/CommandHandler/devops_permissions_token";
import { mkdir                     } from "fs/promises";
import { TestConfigurationProvider } from "../../../../_Configuration/TestConfiguration";

test('devops_permissions_token-all'                 , async () => { await runtest('all'                 , devops_permissions_token.all                 ) }, 100000);
test('devops_permissions_token-analyticsViews'      , async () => { await runtest('analyticsViews'      , devops_permissions_token.analyticsViews      ) }, 100000);
test('devops_permissions_token-buildDefinitions'    , async () => { await runtest('buildDefinitions'    , devops_permissions_token.buildDefinitions    ) }, 100000);
test('devops_permissions_token-identity'            , async () => { await runtest('identity'            , devops_permissions_token.identity            ) }, 100000);
test('devops_permissions_token-classificationNodes' , async () => { await runtest('classificationNodes' , devops_permissions_token.classificationNodes ) }, 100000);
test('devops_permissions_token-dashboardsPrivileges', async () => { await runtest('dashboardsPrivileges', devops_permissions_token.dashboardsPrivileges) }, 100000);
test('devops_permissions_token-gitRepositories'     , async () => { await runtest('gitRepositories'     , devops_permissions_token.gitRepositories     ) }, 100000);
test('devops_permissions_token-plan'                , async () => { await runtest('plan'                , devops_permissions_token.plan                ) }, 100000);
test('devops_permissions_token-project'             , async () => { await runtest('project'             , devops_permissions_token.project             ) }, 100000);
test('devops_permissions_token-releaseManagement'   , async () => { await runtest('releaseManagement'   , devops_permissions_token.releaseManagement   ) }, 100000);
test('devops_permissions_token-tagging'             , async () => { await runtest('tagging'             , devops_permissions_token.tagging             ) }, 100000);
test('devops_permissions_token-workItemQueryFolders', async () => { await runtest('workItemQueryFolders', devops_permissions_token.workItemQueryFolders) }, 100000);

const runtest = async (name: string, func: (tenant: string, organization: string, project: string, path: string) => Promise<void>) => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const projectName  = config.azureDevOps.projectName;
    const tenant       = config.azureDevOps.tenant;

    await mkdir(path.join(__dirname, 'out', organization, projectName, name), { recursive: true })
    const pathOut = path.join(__dirname, 'out', organization, projectName, name, `devops_permissions_token`);

    await func(tenant, organization, projectName, pathOut);
}
