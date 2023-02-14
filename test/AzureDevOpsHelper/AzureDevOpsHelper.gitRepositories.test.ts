import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsWrapper        } from "../../src/AzureDevOpsWrapper";
import { AzureDevOpsSecurityTokens } from "../../src/AzureDevOpsSecurityTokens";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper                } from "../_TestHelper/TestHelper";

test('AzureDevOpsHelper - gitRepositories', async () => {
    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const projectName = config.azureDevOps.projectName;
    const baseUrl = config.azureDevOps.baseUrl;

    const azureDevOpsHelper = new AzureDevOpsHelper();
    const azureDevOpsWrapper = await AzureDevOpsWrapper.instance(baseUrl);

    const gitRepositories = await azureDevOpsWrapper.gitRepositories(projectName);

    const securityNamespaceName = 'Git Repositories';
    const securityNamespace = await azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);
    if (securityNamespace?.namespaceId === undefined) { throw new Error(`securityNamespaceByName(${organization}, ${securityNamespaceName}).value.namespaceId === undefined`); }

    const maxNumerOfTests = 5;

    for (const gitRepository of gitRepositories.slice(0, maxNumerOfTests)) {
        const projectId = gitRepository.project?.id; if (projectId === undefined) { throw new Error("projectId === undefined"); }
        const repositoryId = gitRepository.id; if (repositoryId === undefined) { throw new Error("repositoryId === undefined"); }
        const securityNamespaceId = securityNamespace.namespaceId;

        {
            const securityToken = AzureDevOpsSecurityTokens.GitRepositories_Project(projectId)

            const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId, token: securityToken });
            if (accessControlLists.length === 0) { throw new Error(`accessControlLists(${JSON.stringify({ organization, securityNamespaceId, token: securityToken })}).value.length === 0`); }
        }

        {
            const securityToken = AzureDevOpsSecurityTokens.GitRepositories_Project_Repository(projectId, repositoryId)

            const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId, token: securityToken });
            if (accessControlLists.length === 0) { throw new Error(`accessControlLists(${JSON.stringify({ organization, securityNamespaceId, token: securityToken })}).value.length === 0`); }
        }

        {
            if (gitRepository.defaultBranch !== undefined) {
                const securityToken = AzureDevOpsSecurityTokens.GitRepositories_Project_Repository_Branch(projectId, repositoryId, gitRepository.defaultBranch)

                const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId, token: securityToken });
                if (accessControlLists.length === 0) { throw new Error(`accessControlLists(${JSON.stringify({ organization, securityNamespaceId, token: securityToken })}).value.length === 0`); }
            }
        }

    }
}, 100000);
