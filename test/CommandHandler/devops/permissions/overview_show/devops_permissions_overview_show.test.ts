import   path                               from "path";
import { AzureDevOpsHelper                } from "../../../../../src/AzureDevOpsHelper";
import { AzureDevOpsSecurityTokens        } from "../../../../../src/AzureDevOpsSecurityTokens";
import { devops_permissions_overview_show } from "../../../../../src/CommandHandler/devops_permissions_overview_show";
import { Helper                           } from "../../../../../src/Helper";
import { mkdir                            } from "fs/promises";
import { TestConfigurationProvider        } from "../../../../_Configuration/TestConfiguration";

test('devops_permissions_overview_show', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const projectName      = config.azureDevOps.projectName;
    const tenantId         = config.azureDevOps.tenantId;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;
    
    await mkdir(path.join(__dirname, 'out'), { recursive: true })
    const pathOut = path.join(__dirname, 'out', 'devops_permissions_overview_show');

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const tokens = await AzureDevOpsSecurityTokens.all(azureDevOpsHelper, organization, projectName);

    const items = tokens.filter(p => p.securityNamespace.name !== undefined).map(p => { return { token: p.token, securityNamespaceName: p.securityNamespace.name! } });

    const batches = Helper.getBatches(items.slice(0, maxNumberOfTests), 5);

    for (const batch of batches) {
        await Promise.all(
            batch.map(
                p => devops_permissions_overview_show.handle(tenantId, organization, projectName, p.securityNamespaceName, p.token, pathOut)
            )
        )
    }
}, 1000000);

test('devops_permissions_overview_show_classificationNodes', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const projectName  = config.azureDevOps.projectName;
    const tenantId     = config.azureDevOps.tenantId;

    await mkdir(path.join(__dirname, 'out'), { recursive: true })
    const pathOut = path.join(__dirname, 'out', 'devops_permissions_overview_show_classificationNodes');

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const classificationNodes = await AzureDevOpsSecurityTokens.classificationNodes(azureDevOpsHelper, organization, projectName);

    for(const classificationNode of classificationNodes){
        if( classificationNode.securityNamespace.name === undefined){
            throw new Error(JSON.stringify({organization, projectName, classificationNode, error:'classificationNode.securityNamespace.name === undefined'}))
        }

        await devops_permissions_overview_show.handle(tenantId, organization, projectName, classificationNode.securityNamespace.name, classificationNode.token, pathOut);
    }
}, 1000000);