import   path                               from "path";
import { AzureDevOpsSecurityTokens        } from "../../../../../src/AzureDevOpsSecurityTokens";
import { AzureDevOpsHelper                } from "../../../../../src/AzureDevOpsHelper";
import { devops_permissions_overview_show } from "../../../../../src/CommandHandler/devops_permissions_overview_show";
import { TestConfigurationProvider        } from "../../../../_Configuration/TestConfiguration";

test('devops_permissions_overview_show', async () => {
    const config            = await TestConfigurationProvider.get();
    const pathOut           = path.join(__dirname, 'out', 'devops_permissions_overview_show');
    const organization      = config.azureDevOps.organization;
    const projectName       = config.azureDevOps.projectName;
    const tenantId          = config.azureDevOps.tenantId;
    const maxNumberOfTests  = config.azureDevOps.maxNumberOfTests;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const tokens = await AzureDevOpsSecurityTokens.all(azureDevOpsHelper, organization, projectName);

    for (const item of tokens.slice(0, maxNumberOfTests)) {

        const securityNamespaceName = item.securityNamespace.name; if (securityNamespaceName === undefined) { continue; }
        const token = item.token;

        await devops_permissions_overview_show.handle(tenantId, organization, projectName, securityNamespaceName, token, pathOut);
    }
}, 1000000);

test('devops_permissions_overview_show_classificationNodes', async () => {
    const config          = await TestConfigurationProvider.get();
    const pathOut         = path.join(__dirname, 'out', 'devops_permissions_overview_show_classificationNodes');
    const organization    = config.azureDevOps.organization;
    const projectName     = config.azureDevOps.projectName;
    const tenantId        = config.azureDevOps.tenantId;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const classificationNodes = await AzureDevOpsSecurityTokens.classificationNodes(azureDevOpsHelper, organization, projectName);

    for(const classificationNode of classificationNodes){
        if( classificationNode.securityNamespace.name === undefined){
            throw new Error(JSON.stringify({organization, projectName, classificationNode, error:'classificationNode.securityNamespace.name === undefined'}))
        }

        await devops_permissions_overview_show.handle(tenantId, organization, projectName, classificationNode.securityNamespace.name, classificationNode.token, pathOut);
    }
}, 1000000);