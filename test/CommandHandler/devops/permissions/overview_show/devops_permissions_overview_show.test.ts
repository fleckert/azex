import   path                               from "path";
import { AzureDevOpsSecurityTokens        } from "../../../../../src/AzureDevOpsSecurityTokens";
import { AzureDevOpsHelper                } from "../../../../../src/AzureDevOpsHelper";
import { devops_permissions_overview_show } from "../../../../../src/CommandHandler/devops_permissions_overview_show";
import { TestConfigurationProvider        } from "../../../../_Configuration/TestConfiguration";

test('devops_permissions_overview_show', async () => {
    const config          = await TestConfigurationProvider.get();
    const pathOut         = path.join(__dirname, 'out', 'devops_permissions_overview_show');
    const organization    = config.azureDevOps.organization;
    const projectName     = config.azureDevOps.projectName;
    const tenantId        = config.azureDevOps.tenantId;
    const maxNumerOfTests = 500;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const tokens = await AzureDevOpsSecurityTokens.all(azureDevOpsHelper, organization, projectName);

    for (const item of tokens.slice(0, maxNumerOfTests)) {

        const securityNamespaceName = item.securityNamespace?.name; if (securityNamespaceName === undefined) { continue; }
        const token = item.token;
                    // vstfs:///Classification/Node/e4cfd657-81d6-41aa-9058-e0dc97ac167e:vstfs:///Classification/Node/ff692e98-224a-4f9e-89a0-327765c72af4
        // if (token !== 'vstfs:///Classification/Node/e4cfd657-81d6-41aa-9058-e0dc97ac167e:vstfs:///Classification/Node/ff692e98-224a-4f9e-89a0-327765c72af4') {
        //     continue;
        // }

        await devops_permissions_overview_show.handle(tenantId, organization, projectName, securityNamespaceName, token, pathOut);
    }
}, 100000);

test('devops_permissions_overview_show_classificationNodes', async () => {
    const config          = await TestConfigurationProvider.get();
    const pathOut         = path.join(__dirname, 'out', 'devops_permissions_overview_show_classificationNodes');
    const organization    = config.azureDevOps.organization;
    const projectName     = config.azureDevOps.projectName;
    const tenantId        = config.azureDevOps.tenantId;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const classificationNodes = await AzureDevOpsSecurityTokens.classificationNodes(azureDevOpsHelper, organization, projectName);

    await devops_permissions_overview_show.handle(tenantId, organization, projectName, classificationNodes[0].securityNamespace!.name!, classificationNodes[0].token, pathOut);
}, 100000);