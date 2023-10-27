import   path                                                         from "path";
import { AzureDevOpsHelper                                          } from "../../../../../src/AzureDevOpsHelper";
import { AzureDevOpsSecurityTokenElement, AzureDevOpsSecurityTokens } from "../../../../../src/AzureDevOpsSecurityTokens";
import { devops_permissions_overview_show                           } from "../../../../../src/CommandHandler/devops_permissions_overview_show";
import { Helper                                                     } from "../../../../../src/Helper";
import { mkdir                                                      } from "fs/promises";
import { TestConfigurationProvider                                  } from "../../../../_Configuration/TestConfiguration";

test('devops_permissions_overview_show_all'                              , async () => { await runTest           ('all'                 , AzureDevOpsSecurityTokens.all                 ); }, 1000000);
test('devops_permissions_overview_show_auditLog'                         , async () => { await runTest           ('auditLog'            , AzureDevOpsSecurityTokens.auditLog            ); }, 1000000);
test('devops_permissions_overview_show_analytics'                        , async () => { await runTest           ('analytics'           , AzureDevOpsSecurityTokens.analytics           ); }, 1000000);
test('devops_permissions_overview_show_analyticsViews'                   , async () => { await runTest           ('analyticsViews'      , AzureDevOpsSecurityTokens.analyticsViews      ); }, 1000000);
test('devops_permissions_overview_show_buildDefinitions'                 , async () => { await runTest           ('buildDefinitions'    , AzureDevOpsSecurityTokens.buildDefinitions    ); }, 1000000);
test('devops_permissions_overview_show_classificationNodes'              , async () => { await runTest           ('classificationNodes ', AzureDevOpsSecurityTokens.classificationNodes ); }, 1000000);
test('devops_permissions_overview_show_dashboardsPrivileges'             , async () => { await runTest           ('dashboardsPrivileges', AzureDevOpsSecurityTokens.dashboardsPrivileges); }, 1000000);
test('devops_permissions_overview_show_environment'                      , async () => { await runTest           ('environment'         , AzureDevOpsSecurityTokens.environment         ); }, 1000000);
test('devops_permissions_overview_show_gitRepositories'                  , async () => { await runTest           ('gitRepositories'     , AzureDevOpsSecurityTokens.gitRepositories     ); }, 1000000);
test('devops_permissions_overview_show_identity'                         , async () => { await runTest           ('identity'            , AzureDevOpsSecurityTokens.identity            ); }, 1000000);
test('devops_permissions_overview_show_plans'                            , async () => { await runTest           ('plan'                , AzureDevOpsSecurityTokens.plan                ); }, 1000000);
test('devops_permissions_overview_show_library'                          , async () => { await runTest           ('library'             , AzureDevOpsSecurityTokens.library             ); }, 1000000);
test('devops_permissions_overview_show_project'                          , async () => { await runTest           ('project'             , AzureDevOpsSecurityTokens.project             ); }, 1000000);
test('devops_permissions_overview_show_process'                          , async () => { await runTest           ('process'             , AzureDevOpsSecurityTokens.process             ); }, 1000000);
test('devops_permissions_overview_show_releaseManagement'                , async () => { await runTest           ('releaseManagement'   , AzureDevOpsSecurityTokens.releaseManagement   ); }, 1000000);
test('devops_permissions_overview_show_tagging'                          , async () => { await runTest           ('tagging'             , AzureDevOpsSecurityTokens.tagging             ); }, 1000000);
test('devops_permissions_overview_show_workItemQueryFolders'             , async () => { await runTest           ('workItemQueryFolders', AzureDevOpsSecurityTokens.workItemQueryFolders); }, 1000000);

test('devops_permissions_overview_show_all_projects_all'                 , async () => { await runTestAllProjects('all'                 , AzureDevOpsSecurityTokens.all                 ); }, 1000000);
test('devops_permissions_overview_show_all_projects_auditLog'            , async () => { await runTestAllProjects('auditLog'            , AzureDevOpsSecurityTokens.auditLog            ); }, 1000000);
test('devops_permissions_overview_show_all_projects_analytics'           , async () => { await runTestAllProjects('analytics'           , AzureDevOpsSecurityTokens.analytics           ); }, 1000000);
test('devops_permissions_overview_show_all_projects_analyticsViews'      , async () => { await runTestAllProjects('analyticsViews'      , AzureDevOpsSecurityTokens.analyticsViews      ); }, 1000000);
test('devops_permissions_overview_show_all_projects_buildDefinitions'    , async () => { await runTestAllProjects('buildDefinitions'    , AzureDevOpsSecurityTokens.buildDefinitions    ); }, 1000000);
test('devops_permissions_overview_show_all_projects_classificationNodes' , async () => { await runTestAllProjects('classificationNodes ', AzureDevOpsSecurityTokens.classificationNodes ); }, 1000000);
test('devops_permissions_overview_show_all_projects_dashboardsPrivileges', async () => { await runTestAllProjects('dashboardsPrivileges', AzureDevOpsSecurityTokens.dashboardsPrivileges); }, 1000000);
test('devops_permissions_overview_show_all_environment'                  , async () => { await runTestAllProjects('environment'         , AzureDevOpsSecurityTokens.environment         ); }, 1000000);
test('devops_permissions_overview_show_all_projects_gitRepositories'     , async () => { await runTestAllProjects('gitRepositories'     , AzureDevOpsSecurityTokens.gitRepositories     ); }, 1000000);
test('devops_permissions_overview_show_all_projects_identity'            , async () => { await runTestAllProjects('identity'            , AzureDevOpsSecurityTokens.identity            ); }, 1000000);
test('devops_permissions_overview_show_all_projects_library'             , async () => { await runTestAllProjects('library'             , AzureDevOpsSecurityTokens.library             ); }, 1000000);
test('devops_permissions_overview_show_all_projects_plans'               , async () => { await runTestAllProjects('plan'                , AzureDevOpsSecurityTokens.plan                ); }, 1000000);
test('devops_permissions_overview_show_all_projects_project'             , async () => { await runTestAllProjects('project'             , AzureDevOpsSecurityTokens.project             ); }, 1000000);
test('devops_permissions_overview_show_all_projects_process'             , async () => { await runTestAllProjects('process'             , AzureDevOpsSecurityTokens.process             ); }, 1000000);
test('devops_permissions_overview_show_all_projects_releaseManagement'   , async () => { await runTestAllProjects('releaseManagement'   , AzureDevOpsSecurityTokens.releaseManagement   ); }, 1000000);
test('devops_permissions_overview_show_all_projects_tagging'             , async () => { await runTestAllProjects('tagging'             , AzureDevOpsSecurityTokens.tagging             ); }, 1000000);
test('devops_permissions_overview_show_all_projects_workItemQueryFolders', async () => { await runTestAllProjects('workItemQueryFolders', AzureDevOpsSecurityTokens.workItemQueryFolders); }, 1000000);

const runTest = async (
    name: string, 
    func: (azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string) => Promise<Array<AzureDevOpsSecurityTokenElement>>
) => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const projectName      = config.azureDevOps.projectName;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;

    await mkdir(path.join(__dirname, 'out', organization, projectName, name), { recursive: true })
    const pathOut = path.join(__dirname, 'out', organization, projectName, name, 'devops_permissions_overview_show');

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);
    const tokens = await func(azureDevOpsHelper, organization, projectName);

    tokens.sort((a,b,)=> `${a.id}`.toLowerCase().localeCompare(`${b.id}`.toLowerCase()));
    
    const items = tokens.filter(p => p.securityNamespace.name !== undefined).map(p => { return { token: p.token, securityNamespaceName: p.securityNamespace.name! } });

    const batches = Helper.getBatches(items.slice(0, maxNumberOfTests), 5);

    for (const batch of batches) {
        await Promise.all(
            batch.map(
                p => devops_permissions_overview_show.handle(tenant, organization, projectName, p.securityNamespaceName, p.token, pathOut)
            )
        )
    }
}

const runTestAllProjects = async (
    name: string, 
    func: (azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string) => Promise<Array<AzureDevOpsSecurityTokenElement>>
) => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const tenant           = config.azureDevOps.tenant;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;
    
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

    const projects = await azureDevOpsHelper.projects(organization, maxNumberOfTests);

    for (const project of projects.filter(p => p.name !== undefined)) {
        const projectName = project.name!;

        await mkdir(path.join(__dirname, 'out', organization, projectName, name), { recursive: true })
        const pathOut = path.join(__dirname, 'out', organization, projectName, name, 'devops_permissions_overview_show');

        const tokens = await func(azureDevOpsHelper, organization, projectName);

        const items = tokens.filter(p => p.securityNamespace.name !== undefined).map(p => { return { token: p.token, securityNamespaceName: p.securityNamespace.name! } });

        const batches = Helper.getBatches(items.slice(0, maxNumberOfTests), 5);

        for (const batch of batches) {
            await Promise.all(
                batch.map(
                    p => devops_permissions_overview_show.handle(tenant, organization, projectName, p.securityNamespaceName, p.token, pathOut)
                )
            )
        }
    }
}