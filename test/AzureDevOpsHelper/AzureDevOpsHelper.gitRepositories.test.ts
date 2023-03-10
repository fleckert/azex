import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsSecurityTokens } from "../../src/AzureDevOpsSecurityTokens";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - gitRepositories', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const projectName      = config.azureDevOps.projectName;
    const tenantId         = config.azureDevOps.tenantId;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const gitRepositories = await azureDevOpsHelper.gitRepositories(organization, projectName);

    const securityNamespaceName = 'Git Repositories';
    const securityNamespace = await azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);
    if (securityNamespace.namespaceId === undefined) { throw new Error(`securityNamespace.namespaceId === undefined (${JSON.stringify({ organization, securityNamespaceName })}`); }

    for (const gitRepository of gitRepositories.slice(0, maxNumberOfTests)) {
        const projectId    = gitRepository.project?.id; if (projectId    === undefined) { throw new Error("projectId === undefined"   ); }
        const repositoryId = gitRepository.id         ; if (repositoryId === undefined) { throw new Error("repositoryId === undefined"); }
        const securityNamespaceId = securityNamespace.namespaceId;

        {
            const token = AzureDevOpsSecurityTokens.GitRepositories_Project(projectId);

            const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId, token });
            // if (accessControlLists.length === 0) { throw new Error(`accessControlLists.length === 0 ${JSON.stringify({ organization, securityNamespaceId, token, gitRepository })}`); }
        }

        {
            const token = AzureDevOpsSecurityTokens.GitRepositories_Project_Repository(projectId, repositoryId);

            const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId, token });
            //if (accessControlLists.length === 0) { throw new Error(`accessControlLists.length === 0 ${JSON.stringify({ organization, securityNamespaceId, token, gitRepository })}`); }
        }

        {
            if (gitRepository.defaultBranch !== undefined) {
                const token = AzureDevOpsSecurityTokens.GitRepositories_Project_Repository_Branch(projectId, repositoryId, gitRepository.defaultBranch);

                const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId, token });
                // if (accessControlLists.length === 0) { throw new Error(`accessControlLists.length === 0 ${JSON.stringify({ organization, securityNamespaceId, token, gitRepository })}`); }
            }
        }
    }
}, 100000);
