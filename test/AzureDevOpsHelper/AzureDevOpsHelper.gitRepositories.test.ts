import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsSecurityTokens } from "../../src/AzureDevOpsSecurityTokens";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { appendFile, writeFile     } from "fs/promises";
import { TestHelper } from "../_TestHelper/TestHelper";

test('AzureDevOpsHelper - gitRepositories', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;
    const projectName = config.azureDevOps.projectName;

    const gitRepositories = await azureDevOpsHelper.gitRepositories(organization, projectName);
    TestHelper.checkValueAndError(gitRepositories, { organization, projectName });

    const securityNamespaceName = 'Git Repositories';
    const securityNamespace = await azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);
    TestHelper.checkValueAndError(securityNamespace, { organization, securityNamespaceName });
    if (securityNamespace.value!.namespaceId === undefined) { throw new Error(`securityNamespaceByName(${organization}, ${securityNamespaceName}).value.namespaceId === undefined`); }

    const maxNumerOfTests = 5;

    for (const gitRepository of gitRepositories.value!.slice(0, maxNumerOfTests)) {
        const projectId = gitRepository.project?.id; if (projectId === undefined) { throw new Error("projectId === undefined"); }
        const repositoryId = gitRepository.id; if (repositoryId === undefined) { throw new Error("repositoryId === undefined"); }
        const securityNamespaceId = securityNamespace.value!.namespaceId;

        {
            const securityToken = AzureDevOpsSecurityTokens.GitRepositories_Project(projectId)

            const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId, token: securityToken });
            TestHelper.checkValueAndError(accessControlLists, { organization, securityNamespaceId, token: securityToken });
            if (accessControlLists.value!.length === 0) { throw new Error(`accessControlLists(${JSON.stringify({ organization, securityNamespaceId, token: securityToken })}).value.length === 0`); }
        }

        {
            const securityToken = AzureDevOpsSecurityTokens.GitRepositories_Project_Repository(projectId, repositoryId)

            const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId, token: securityToken });
            TestHelper.checkValueAndError(accessControlLists, { organization, securityNamespaceId, token: securityToken });
            if (accessControlLists.value!.length === 0) { throw new Error(`accessControlLists(${JSON.stringify({ organization, securityNamespaceId, token: securityToken })}).value.length === 0`); }
        }

        {
            if (gitRepository.defaultBranch !== undefined) {
                const securityToken = AzureDevOpsSecurityTokens.GitRepositories_Project_Repository_Branch(projectId, repositoryId, gitRepository.defaultBranch)

                const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId, token: securityToken });
                TestHelper.checkValueAndError(accessControlLists, { organization, securityNamespaceId, token: securityToken });
                if (accessControlLists.value!.length === 0) { throw new Error(`accessControlLists(${JSON.stringify({ organization, securityNamespaceId, token: securityToken })}).value.length === 0`); }
            }
        }

    }
}, 100000);