import { AzureDevOpsHelper         } from "../../../../../src/AzureDevOpsHelper";
import { devops_permissions_token  } from "../../../../../src/CommandHandler/devops_permissions_token";
import { TestConfigurationProvider } from "../../../../_Configuration/TestConfiguration";
import { TestHelper                } from "../../../../_TestHelper/TestHelper";

test('devops_permissions_token-all'                             , async () => { await runtest           ('all'                 , devops_permissions_token.all                 ) }, 100000);
test('devops_permissions_token-auditLog'                        , async () => { await runtest           ('auditLog'            , devops_permissions_token.auditLog            ) }, 100000);
test('devops_permissions_token-analytics'                       , async () => { await runtest           ('analytics'           , devops_permissions_token.analytics           ) }, 100000);
test('devops_permissions_token-analyticsViews'                  , async () => { await runtest           ('analyticsViews'      , devops_permissions_token.analyticsViews      ) }, 100000);
test('devops_permissions_token-buildDefinitions'                , async () => { await runtest           ('buildDefinitions'    , devops_permissions_token.buildDefinitions    ) }, 100000);
test('devops_permissions_token-identity'                        , async () => { await runtest           ('identity'            , devops_permissions_token.identity            ) }, 100000);
test('devops_permissions_token-classificationNodes'             , async () => { await runtest           ('classificationNodes' , devops_permissions_token.classificationNodes ) }, 100000);
test('devops_permissions_token-dashboardsPrivileges'            , async () => { await runtest           ('dashboardsPrivileges', devops_permissions_token.dashboardsPrivileges) }, 100000);
test('devops_permissions_token-gitRepositories'                 , async () => { await runtest           ('gitRepositories'     , devops_permissions_token.gitRepositories     ) }, 100000);
test('devops_permissions_token-library'                         , async () => { await runtest           ('library'             , devops_permissions_token.library             ) }, 100000);
test('devops_permissions_token-plan'                            , async () => { await runtest           ('plan'                , devops_permissions_token.plan                ) }, 100000);
test('devops_permissions_token-project'                         , async () => { await runtest           ('project'             , devops_permissions_token.project             ) }, 100000);
test('devops_permissions_token-process'                         , async () => { await runtest           ('process'             , devops_permissions_token.process             ) }, 100000);
test('devops_permissions_token-releaseManagement'               , async () => { await runtest           ('releaseManagement'   , devops_permissions_token.releaseManagement   ) }, 100000);
test('devops_permissions_token-tagging'                         , async () => { await runtest           ('tagging'             , devops_permissions_token.tagging             ) }, 100000);
test('devops_permissions_token-workItemQueryFolders'            , async () => { await runtest           ('workItemQueryFolders', devops_permissions_token.workItemQueryFolders) }, 100000);

test('devops_permissions_token-allProjects_all'                 , async () => { await runtestAllProjects('all'                 , devops_permissions_token.all                 ) }, 100000);
test('devops_permissions_token-allProjects_auditLog'            , async () => { await runtestAllProjects('auditLog'            , devops_permissions_token.auditLog            ) }, 100000);
test('devops_permissions_token-allProjects_analytics'           , async () => { await runtestAllProjects('analytics'           , devops_permissions_token.analytics           ) }, 100000);
test('devops_permissions_token-allProjects_analyticsViews'      , async () => { await runtestAllProjects('analyticsViews'      , devops_permissions_token.analyticsViews      ) }, 100000);
test('devops_permissions_token-allProjects_buildDefinitions'    , async () => { await runtestAllProjects('buildDefinitions'    , devops_permissions_token.buildDefinitions    ) }, 100000);
test('devops_permissions_token-allProjects_identity'            , async () => { await runtestAllProjects('identity'            , devops_permissions_token.identity            ) }, 100000);
test('devops_permissions_token-allProjects_classificationNodes' , async () => { await runtestAllProjects('classificationNodes' , devops_permissions_token.classificationNodes ) }, 100000);
test('devops_permissions_token-allProjects_dashboardsPrivileges', async () => { await runtestAllProjects('dashboardsPrivileges', devops_permissions_token.dashboardsPrivileges) }, 100000);
test('devops_permissions_token-allProjects_gitRepositories'     , async () => { await runtestAllProjects('gitRepositories'     , devops_permissions_token.gitRepositories     ) }, 100000);
test('devops_permissions_token-allProjects_library'             , async () => { await runtestAllProjects('library'             , devops_permissions_token.library             ) }, 100000);
test('devops_permissions_token-allProjects_plan'                , async () => { await runtestAllProjects('plan'                , devops_permissions_token.plan                ) }, 100000);
test('devops_permissions_token-allProjects_project'             , async () => { await runtestAllProjects('project'             , devops_permissions_token.project             ) }, 100000);
test('devops_permissions_token-allProjects_process'             , async () => { await runtestAllProjects('process'             , devops_permissions_token.process             ) }, 100000);
test('devops_permissions_token-allProjects_releaseManagement'   , async () => { await runtestAllProjects('releaseManagement'   , devops_permissions_token.releaseManagement   ) }, 100000);
test('devops_permissions_token-allProjects_tagging'             , async () => { await runtestAllProjects('tagging'             , devops_permissions_token.tagging             ) }, 100000);
test('devops_permissions_token-allProjects_workItemQueryFolders', async () => { await runtestAllProjects('workItemQueryFolders', devops_permissions_token.workItemQueryFolders) }, 100000);

const runtest = async (name: string, func: (tenant: string, organization: string, project: string, path: string) => Promise<void>) => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const projectName  = config.azureDevOps.projectName;
    const tenant       = config.azureDevOps.tenant;

    const pathOut = await TestHelper.prepareFile([__dirname, 'out', organization, projectName, name, `devops_permissions_token`]);

    await func(tenant, organization, projectName, pathOut);
}

const runtestAllProjects = async (name: string, func: (tenant: string, organization: string, project: string, path: string) => Promise<void>) => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;
    
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    const projects = await azureDevOpsHelper.projects(organization, maxNumberOfTests);

    for (const project of projects.filter(p => p.name !== undefined)) {
        const projectName = project.name!;

        const pathOut = await TestHelper.prepareFile([__dirname, 'out', organization, projectName, name, `devops_permissions_token`]);

        await func(tenant, organization, projectName, pathOut);
    }
}