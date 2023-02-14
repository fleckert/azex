import { AzureDevOpsHelper          } from "./AzureDevOpsHelper";
import { WorkItemClassificationNode } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { ProjectInfo } from "azure-devops-node-api/interfaces/CoreInterfaces";
import { ReleaseDefinition, ReleaseDefinitionEnvironment } from "azure-devops-node-api/interfaces/ReleaseInterfaces";

export class AzureDevOpsSecurityTokens {
    static GitRepositories_Project                  (projectId: string                                          ) { return `repoV2/${projectId}/`                ; }
    static GitRepositories_Project_Repository       (projectId: string, repositoryId: string                    ) { return `repoV2/${projectId}/${repositoryId}/`; }
    static GitRepositories_Project_Repository_Branch(projectId: string, repositoryId: string, branchName: string) {
        const parts=branchName.split('/');

        const firstTwoSegments = parts.slice(0, 2);
        const otherSegments = parts.slice(2).map(p => this.encode(p));

        const partsEncoded = firstTwoSegments.concat(otherSegments).join('/');

        return `repoV2/${projectId}/${repositoryId}/${partsEncoded}/`;
    }

    static async all(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<{ id: string, token: string }>> {
        const gitRepositories     = await this.gitRepositories    (azureDevOpsHelper, organization, project);
        const prjct               = await this.project            (azureDevOpsHelper, organization, project);
        const tagging             = await this.tagging            (azureDevOpsHelper, organization, project);
        const buildDefinitions    = await this.buildDefinitions   (azureDevOpsHelper, organization, project);
        const releaseDefinitions  = await this.releaseDefinitions (azureDevOpsHelper, organization, project);
        const classificationNodes = await this.classificationNodes(azureDevOpsHelper, organization, project);

        const collection = new Array<{ id: string, token: string }>();

        collection.push(...gitRepositories    .value?.map(p => { return { id: `GitRepository ${    p.id}`, token: p.token } }) ?? [{ id: 'GitRepositories'   , token: `Failed to resolve [${gitRepositories    .error}].` }])
        collection.push(...prjct              .value?.map(p => { return { id: `Project ${          p.id}`, token: p.token } }) ?? [{ id: 'Project'           , token: `Failed to resolve [${prjct              .error}].` }])
        collection.push(...tagging            .value?.map(p => { return { id: `Tagging ${          p.id}`, token: p.token } }) ?? [{ id: 'Tagging'           , token: `Failed to resolve [${tagging            .error}].` }])
        collection.push(...buildDefinitions   .value?.map(p => { return { id: `BuildDefinition ${  p.id}`, token: p.token } }) ?? [{ id: 'BuildDefinitions'  , token: `Failed to resolve [${buildDefinitions   .error}].` }])
        collection.push(...releaseDefinitions .value?.map(p => { return { id: `ReleaseDefinition ${p.id}`, token: p.token } }) ?? [{ id: 'ReleaseDefinitions', token: `Failed to resolve [${releaseDefinitions .error}].` }])
        collection.push(...classificationNodes.value?.map(p => { return { id: `Node ${             p.id}`, token: p.token } }) ?? [{ id: 'Nodes'             , token: `Failed to resolve [${classificationNodes.error}].` }])

        collection.sort((a: { id: string, token: string }, b: { id: string, token: string }) => a.id.localeCompare(b.id));

        return collection;
    }

    static async gitRepositories(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<{ value: Array<{ id: string, token: string }> | undefined, error: Error | undefined }> {
        const gitRepositories = await azureDevOpsHelper.gitRepositories(organization, project);

        const value = gitRepositories.map(
            p => {
                return {
                    id: `${p.name}`,
                    token: p.project?.id === undefined || p.id === undefined
                         ? ''
                         : this.GitRepositories_Project_Repository(p.project?.id, p.id)
                }
            });

        return { value, error: undefined };
    }

    static async project(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<{ value: Array<{ id: string, token: string }> | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#project-level-namespaces-and-permissions

        const prjct = await azureDevOpsHelper.projectByNameOrId(organization, project);
        if (prjct === undefined) {
            return { value: undefined, error: new Error(`Failed to resolve project for ${JSON.stringify({ organization, project })}.`) }
        }
        else {
            const value = [{
                id   : `${prjct.name}`,
                token: prjct.id === undefined ? '' : `$PROJECT:vstfs:///Classification/TeamProject/${prjct.id}`
            }];

            return { value, error: undefined };
        }
    }

    static async tagging(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<{ value: Array<{ id: string, token: string }> | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#project-level-namespaces-and-permissions

        const prjct = await azureDevOpsHelper.projectByNameOrId(organization, project);
        if (prjct === undefined) {
            return { value: undefined, error: new Error(`Failed to resolve project for ${JSON.stringify({ organization, project })}.`) }
        }
        else {
            const value = [{
                id   : `${prjct.name}`,
                token: prjct.id === undefined ? '' : `/${prjct.id}`
            }];

            return { value, error: undefined };
        }
    }

    static async buildDefinitions(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<{ value: Array<{ id: string, token: string }> | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#object-level-namespaces-and-permissions

        const collection = await azureDevOpsHelper.buildDefinitions(organization, project);
        const value = collection.map(p => {
            return {
                id: `${p.project?.name} ${p.name}`,
                token: p.project?.id === undefined || p.id === undefined ? '' : `${p.project.id}/${p.id}`
            }
        });

        return { value, error: undefined };
    }

    static async releaseDefinitions(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<{ value: Array<{ id: string, token: string }> | undefined, error: Error | undefined }> {
        const prjct = await azureDevOpsHelper.projectByNameOrId(organization, project)

        if (prjct === undefined) {
            return { value: undefined, error: new Error(`Failed to resolve project for ${JSON.stringify({ organization, project })}.`) }
        }
        else {
            const collection = await azureDevOpsHelper.releaseDefinitions(organization, project);
            const value = new Array<{ id: string, token: string }>();

            for (const item of collection) {
                const items = this.releaseDefinitionTokens(prjct, item);

                value.push(...items);
            }

            return { value, error: undefined };
        }
    }

    static async classificationNodes(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<{ value: Array<{ id: string, token: string }> | undefined, error: Error | undefined }> {
        const depth = 10000;
        const parameters = { organization, project, depth };
        const classificationNodes = await azureDevOpsHelper.classificationNodes(parameters);

        const collection = new Array<{ id: string, token: string }>();

        const paths = this.resolvePaths(classificationNodes);
        for (const path of paths) {
            const nodes = this.resolveNodes(path, classificationNodes);
            const token = nodes.map(p => `vstfs:///Classification/Node/${p.identifier}`).join(':');

            collection.push({ id: path, token });
        }

        return { value: collection, error: undefined };
    }

    private static resolvePaths(nodes: WorkItemClassificationNode[]): string[] {
        const paths = new Array<string>();

        for (const node of nodes) {
            if (node.path !== undefined) {
                paths.push(node.path);
            }
            if (node.children !== undefined) {
                const childPaths = this.resolvePaths(node.children);

                paths.push(...childPaths);
            }
        }

        return paths;
    }

    private static resolveNodes(path: string, nodes: WorkItemClassificationNode[]): WorkItemClassificationNode[] {
        const node = nodes.find(p => p.path !== undefined && path.toLowerCase().startsWith(p.path!.toLowerCase()));

        if (node === undefined) {
            return new Array<WorkItemClassificationNode>();
        }
        else if (path.toLowerCase() === node.path?.toLowerCase()) {
            return [node];
        }
        else if (node.children !== undefined) {
            return [node, ...this.resolveNodes(path, node.children)];
        }
        else {
            return new Array<WorkItemClassificationNode>();
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

    private static releaseDefinitionTokens(projectInfo: ProjectInfo, releaseDefinition: ReleaseDefinition): Array<{ id: string, token: string }>
    {
        if(projectInfo.id === undefined){
            return [];
        }
        else if(releaseDefinition.id == undefined){
            return [];
        }
        else{
            // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#object-level-namespaces-and-permissions
            // Token format for project-level permissions: PROJECT_ID
            // Example: xxxxxxxx-a1de-4bc8-b751-188eea17c3ba
            //
            // If you need to update permissions for a particular release definition ID, for example, 12, 
            // security token for that release definition looks as follows:
            //
            // Token format for specific release definition permissions: PROJECT_ID/12
            // Example: xxxxxxxx-a1de-4bc8-b751-188eea17c3ba/12
            //
            // If the release definition ID lives in a folder, then the security tokens look as follows:
            // Token format: PROJECT_ID/{folderName}/12
            // For stages, tokens look like: PROJECT_ID/{folderName}/{DefinitionId}/Environment/{EnvironmentId}.

            // PROJECT_ID
            //
            // PROJECT_ID/{DefinitionId}
            // PROJECT_ID/{DefinitionId}/Environment/{EnvironmentId}
            //
            // PROJECT_ID/{folderName}/{DefinitionId}
            // PROJECT_ID/{folderName}/{DefinitionId}/Environment/{EnvironmentId}

            const folderName = (rd: ReleaseDefinition): string => {
                if (rd.path === undefined) {
                    return '';
                }
                else if (rd.path.length === 0) {
                    return '';
                }
                else if (rd.path === '\\') {
                    return '';
                }
                else {
                    const value = `${rd.path.replaceAll('\\', '/')}/`;
                    return value;
                }
            }

            const displayName = (rd: ReleaseDefinition): string => {
                const value = `${folderName(rd)}${rd.name}` ?? `${folderName(rd)}${rd.id}` ?? `${folderName(rd)}noNameOrId`;
                return value;
            }

            const displayNameEnvironment = (rd: ReleaseDefinition, env: ReleaseDefinitionEnvironment): string => {
                const dsplyNm = displayName(rd);
                const environmentName = `[${env.name ?? env.id}]`;
                const value = `${dsplyNm} ${environmentName}`;
                return value;
            }

            const rootPart = (prjtInfo: ProjectInfo, rd: ReleaseDefinition): string => {
                const fldrNm = folderName(rd);

                const value = `${prjtInfo.id}${fldrNm}${rd.id}`;
                return value;
            }

            const collection = new Array<{ id: string, token: string }>();

            const rootItem = {
                id   : displayName(releaseDefinition),
                token: rootPart(projectInfo, releaseDefinition)
            };
            collection.push(rootItem);

            if (releaseDefinition.environments !== undefined) {
                for (const environment of releaseDefinition.environments) {
                    if (environment.id !== undefined) {
                        const item = {
                            id   : displayNameEnvironment(releaseDefinition, environment),
                            token: `${rootPart(projectInfo, releaseDefinition)}/Environment/${environment.id}`
                        };
                        collection.push(item);
                    }
                }
            }

            return collection;
        }
    }
}
