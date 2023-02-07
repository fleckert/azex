import { TeamSetting, TeamSettingsIteration } from "azure-devops-node-api/interfaces/WorkInterfaces";
import { AzureDevOpsHelper } from "./AzureDevOpsHelper";

export class AzureDevOpsSecurityTokens {
    static GitRepositories_Project                  (projectId: string                                          ) { return `repoV2/${projectId}`                              ; }
    static GitRepositories_Project_Repository       (projectId: string, repositoryId: string                    ) { return `repoV2/${projectId}/${repositoryId}`              ; }
    static GitRepositories_Project_Repository_Branch(projectId: string, repositoryId: string, branchName: string) {
        const parts=branchName.split('/');

        const firstTwoSegments = parts.slice(0, 2);
        const otherSegments = parts.slice(2).map(p => this.encode(p));

        const partsEncoded = firstTwoSegments.concat(otherSegments).join('/');

        return `repoV2/${projectId}/${repositoryId}/${partsEncoded}/`;
    }

    static Iteration_Team_Iteration(teamSetting: TeamSetting) {
        return `vstfs:///Classification/Node/${teamSetting.backlogIteration.id}`;
    }

    static Iteration_Team_Iterations(teamSetting: TeamSetting, teamSettingsIteration: TeamSettingsIteration) {
        return `vstfs:///Classification/Node/${teamSetting.backlogIteration.id}:vstfs:///Classification/Node/${teamSettingsIteration.id}`;
    }

    static async Iteration(azureDevOpsHelper: AzureDevOpsHelper, organization: string, projectName: string, teamName: string, iterationName: string | undefined): Promise<{ value: string | undefined, error: Error | undefined }> {
        const team = await azureDevOpsHelper.team(organization, projectName, teamName);
        if (team.error !== undefined) {
            return { value: undefined, error: new Error(`Failed to resolve team for ${JSON.stringify({organization, projectName, teamName})}. [${team.error }]`) };
        }
        else if (team.value === undefined) {
            return { value: undefined, error: new Error(`Failed to resolve team for ${JSON.stringify({organization, projectName, teamName})}.`) };
        }
        else if (team.value.id === undefined) {
            return { value: undefined, error: new Error(`Failed to resolve id for team for ${JSON.stringify({organization, projectName, teamName})}.`) };
        }
        else if (team.value.projectId === undefined) {
            return { value: undefined, error: new Error(`Failed to resolve projectId for ${JSON.stringify({organization, projectName, teamName})}.`) };
        }
        else {
            const securityNamespaceName = 'Iteration';
            const securityNamespace = await azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);
            if (securityNamespace.error !== undefined) {
                return { value: undefined, error: new Error(`Failed to resolve securityNamespaces for ${JSON.stringify({organization, securityNamespaceName})}. [${securityNamespace.error}]`) };
            }
            else if (securityNamespace.value === undefined) {
                return { value: undefined, error: new Error(`Failed to resolve securityNamespaces for ${JSON.stringify({organization, securityNamespaceName})}.`) };
            }
            else {
                const securityNamespaceId = securityNamespace.value.namespaceId;
                if (securityNamespaceId === undefined) {
                    return { value: undefined, error: new Error(`Failed to resolve securityNamespace.id for ${JSON.stringify({organization, securityNamespaceName})}.`) };
                }
                else {
                    const teamId = team.value.id;
                    const project = team.value.projectId;

                    const workTeamSettings = await azureDevOpsHelper.workTeamSettings(organization, project, teamId);
                    if (workTeamSettings.error !== undefined) {
                        return { value: undefined, error: new Error(`Failed to resolve teamSettings for ${JSON.stringify({organization, project, teamName, teamId})}. [${workTeamSettings.error}]`) };
                    }
                    else if (workTeamSettings.value === undefined) {
                        return { value: undefined, error: new Error(`Failed to resolve teamSettings for ${JSON.stringify({organization, project, teamName, teamId})}.`) };
                    }
                    else if (iterationName === undefined) {
                        const token = AzureDevOpsSecurityTokens.Iteration_Team_Iteration(workTeamSettings.value);

                        return { value: token, error: undefined };
                    }
                    else {
                        const workIteration = await azureDevOpsHelper.workIteration(organization, project, teamId, iterationName);
                        if (workIteration.error !== undefined) {
                            return { value: undefined, error: new Error(`Failed to resolve iteration for ${JSON.stringify({organization, project, teamName, teamId, iterationName})}. [${workIteration.error}]`) };
                        }
                        else if (workIteration.value === undefined) {
                            return { value: undefined, error: new Error(`Failed to resolve iteration for ${JSON.stringify({organization, project, teamName, teamId, iterationName})}.`) };
                        }
                        else {
                            const token = AzureDevOpsSecurityTokens.Iteration_Team_Iterations(workTeamSettings.value, workIteration.value);

                            return { value: token, error: undefined };
                        }
                    }
                }
            }
        }
    }

    private static encode(value: string): string {
        const bytes = Buffer.from(value, 'ascii');
        const chars = new Array<number>();

        for (const b of bytes) {
            chars.push(b);
            chars.push(0);
        }
        const encodedValue = Buffer.from(chars).toString('hex');

        return encodedValue;
    }
}
