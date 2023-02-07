import { AzureDevOpsSecurityTokens } from "../../src/AzureDevOpsSecurityTokens";
import { Guid                      } from "../../src/Guid";

test('AzureDevOpsSecurityTokens-GitRepositories_Project_Repository_Branch', () => {

    const check = (projectId: string, repositoryId: string, branchName: string, expectedResult: string) => {
        const token = AzureDevOpsSecurityTokens.GitRepositories_Project_Repository_Branch(projectId, repositoryId, branchName);

        if (token != expectedResult) {
            throw new Error(`Failed for ${JSON.stringify({ projectId, repositoryId, branchName, expectedResult })}`);
        }
    }

    const projectId = Guid.newGuid();
    const repositoryId = Guid.newGuid();

    const token = AzureDevOpsSecurityTokens.GitRepositories_Project_Repository_Branch(projectId, repositoryId, 'refs/heads/master');

    check(projectId, repositoryId, 'refs/heads/master'             , `repoV2/${projectId}/${repositoryId}/refs/heads/6d0061007300740065007200/`                                              );
    check(projectId, repositoryId, 'refs/heads/user/mattc/feature1', `repoV2/${projectId}/${repositoryId}/refs/heads/7500730065007200/6d006100740074006300/66006500610074007500720065003100/`);

});
