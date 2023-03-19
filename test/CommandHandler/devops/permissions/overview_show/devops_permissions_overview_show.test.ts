import   path                               from "path";
import { AzureDevOpsHelper                } from "../../../../../src/AzureDevOpsHelper";
import { AzureDevOpsSecurityNamespace     } from "../../../../../src/models/AzureDevOpsSecurityNamespace";
import { AzureDevOpsSecurityTokens        } from "../../../../../src/AzureDevOpsSecurityTokens";
import { devops_permissions_overview_show } from "../../../../../src/CommandHandler/devops_permissions_overview_show";
import { Helper                           } from "../../../../../src/Helper";
import { mkdir                            } from "fs/promises";
import { TestConfigurationProvider        } from "../../../../_Configuration/TestConfiguration";

test('devops_permissions_overview_show_all'                 , async () => { await runTest('all'                 , AzureDevOpsSecurityTokens.all                 ); }, 1000000);
test('devops_permissions_overview_show_analyticsViews'      , async () => { await runTest('analyticsViews'      , AzureDevOpsSecurityTokens.analyticsViews      ); }, 1000000);
test('devops_permissions_overview_show_buildDefinitions'    , async () => { await runTest('buildDefinitions'    , AzureDevOpsSecurityTokens.buildDefinitions    ); }, 1000000);
test('devops_permissions_overview_show_classificationNodes' , async () => { await runTest('classificationNodes ', AzureDevOpsSecurityTokens.classificationNodes ); }, 1000000);
test('devops_permissions_overview_show_dashboardsPrivileges', async () => { await runTest('dashboardsPrivileges', AzureDevOpsSecurityTokens.dashboardsPrivileges); }, 1000000);
test('devops_permissions_overview_show_gitRepositories'     , async () => { await runTest('gitRepositories'     , AzureDevOpsSecurityTokens.gitRepositories     ); }, 1000000);
test('devops_permissions_overview_show_identity'            , async () => { await runTest('identity'            , AzureDevOpsSecurityTokens.identity            ); }, 1000000);
test('devops_permissions_overview_show_plans'               , async () => { await runTest('plan'                , AzureDevOpsSecurityTokens.plan                ); }, 1000000);
test('devops_permissions_overview_show_project'             , async () => { await runTest('project'             , AzureDevOpsSecurityTokens.project             ); }, 1000000);
test('devops_permissions_overview_show_releaseManagement'   , async () => { await runTest('releaseManagement'   , AzureDevOpsSecurityTokens.releaseManagement   ); }, 1000000);
test('devops_permissions_overview_show_tagging'             , async () => { await runTest('tagging'             , AzureDevOpsSecurityTokens.tagging             ); }, 1000000);
test('devops_permissions_overview_show_workItemQueryFolders', async () => { await runTest('workItemQueryFolders', AzureDevOpsSecurityTokens.workItemQueryFolders); }, 1000000);

const runTest = async (
    name: string, 
    func: (azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string) => Promise<Array<{ securityNamespace: AzureDevOpsSecurityNamespace, id: string, token: string }>>
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
