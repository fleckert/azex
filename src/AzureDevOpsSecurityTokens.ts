import { AzureDevOpsHelper          } from "./AzureDevOpsHelper";
import { WorkItemClassificationNode } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { ProjectInfo } from "azure-devops-node-api/interfaces/CoreInterfaces";
import { ReleaseDefinition, ReleaseDefinitionEnvironment } from "azure-devops-node-api/interfaces/ReleaseInterfaces";
import { AzureDevOpsSecurityNamespace } from "./models/AzureDevOpsSecurityNamespace";

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

    static async all(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<{ securityNamespace: AzureDevOpsSecurityNamespace, id: string, token: string }>> {
        const gitRepositories     = this.gitRepositories    (azureDevOpsHelper, organization, project);
        const prjct               = this.project            (azureDevOpsHelper, organization, project);
        const tagging             = this.tagging            (azureDevOpsHelper, organization, project);
        const buildDefinitions    = this.buildDefinitions   (azureDevOpsHelper, organization, project);
        const releaseDefinitions  = this.releaseDefinitions (azureDevOpsHelper, organization, project);
        const classificationNodes = this.classificationNodes(azureDevOpsHelper, organization, project);

        const collection = new Array<{ securityNamespace: AzureDevOpsSecurityNamespace, id: string, token: string }>();

        try { collection.push(...(await gitRepositories    ).map(p => { return { securityNamespace: p.securityNamespace, id: p.id, token: p.token } })) }catch{}
        try { collection.push(...(await prjct              ).map(p => { return { securityNamespace: p.securityNamespace, id: p.id, token: p.token } })) }catch{}
        try { collection.push(...(await tagging            ).map(p => { return { securityNamespace: p.securityNamespace, id: p.id, token: p.token } })) }catch{}
        try { collection.push(...(await buildDefinitions   ).map(p => { return { securityNamespace: p.securityNamespace, id: p.id, token: p.token } })) }catch{}
        try { collection.push(...(await releaseDefinitions ).map(p => { return { securityNamespace: p.securityNamespace, id: p.id, token: p.token } })) }catch{}
        try { collection.push(...(await classificationNodes).map(p => { return { securityNamespace: p.securityNamespace, id: p.id, token: p.token } })) }catch{}

        collection.sort(
            (a: { securityNamespace: AzureDevOpsSecurityNamespace, id: string, token: string }, b: { securityNamespace: AzureDevOpsSecurityNamespace, id: string, token: string }) =>
                `${a.securityNamespace.displayName}-${a.id}`.toLowerCase().localeCompare(`${b.securityNamespace.displayName}-${b.id}`.toLowerCase())
        );

        return collection;
    }

    static async gitRepositories(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<{ securityNamespace: AzureDevOpsSecurityNamespace, id: string, token: string }>> {
        const gitRepositories = await azureDevOpsHelper.gitRepositories(organization, project);
        const securityNamespaceName = 'Git Repositories';
        const securityNamespace = await azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);
        const value = gitRepositories.map(
            p => {
                return {
                    securityNamespace,
                    id: `${p.name}`,
                    token: p.project?.id === undefined || p.id === undefined
                         ? ''
                         : this.GitRepositories_Project_Repository(p.project?.id, p.id)
                }
            });

        return value;
    }

    static async project(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<{ securityNamespace: AzureDevOpsSecurityNamespace, id: string, token: string }>> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#project-level-namespaces-and-permissions

        const prjct = await azureDevOpsHelper.project(organization, project);
        if (prjct === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.' }));
        }
        else {
            const securityNamespaceName = 'Project';
            const securityNamespace = await azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);
            const value = [{
                securityNamespace: securityNamespace,
                id   : `${prjct.name}`,
                token: prjct.id === undefined ? '' : `$PROJECT:vstfs:///Classification/TeamProject/${prjct.id}`
            }];

            return value;
        }
    }

    static async tagging(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<{  securityNamespace: AzureDevOpsSecurityNamespace, id: string, token: string }>> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#project-level-namespaces-and-permissions

        const prjct = await azureDevOpsHelper.project(organization, project);
        if (prjct === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.' }));
        }
        else {
            const securityNamespaceName = 'Tagging';
            const securityNamespace = await azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);
            const value = [{
                securityNamespace: securityNamespace,
                id   : `${prjct.name}`,
                token: prjct.id === undefined ? '' : `/${prjct.id}`
            }];

            return value;
        }
    }

    static async buildDefinitions(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<{  securityNamespace: AzureDevOpsSecurityNamespace, id: string, token: string }>> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#object-level-namespaces-and-permissions

        const collection = await azureDevOpsHelper.buildDefinitions(organization, project);
        const securityNamespaceName = 'BuildAdministration';
        const securityNamespace = await azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);
        const value = collection.map(p => {
            return {
                securityNamespace: securityNamespace,
                id: `${p.project?.name} ${p.name}`,
                token: p.project?.id === undefined || p.id === undefined ? '' : `${p.project.id}/${p.id}`
            }
        });

        return value;
    }

    static async releaseDefinitions(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<{  securityNamespace: AzureDevOpsSecurityNamespace, id: string, token: string }>> {
        const prjct = await azureDevOpsHelper.project(organization, project)

        if (prjct === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.' }));
        }
        else {
            const collection = await azureDevOpsHelper.releaseDefinitions(organization, project);
            const value = new Array<{ securityNamespace: AzureDevOpsSecurityNamespace, id: string, token: string }>();
            const securityNamespaceName = 'ReleaseManagement';
            const securityNamespace = await azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);

            for (const item of collection) {
                const items = this.releaseDefinitionTokens(prjct, securityNamespace, item);

                value.push(...items);
            }

            return value;
        }
    }

    static async classificationNodes(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<{  securityNamespace: AzureDevOpsSecurityNamespace, id: string, token: string }>> {
        const depth = 10000;
        const parameters = { organization, project, depth };
        const classificationNodes = await azureDevOpsHelper.classificationNodes(parameters);
        const securityNamespaceName = 'CSS';
        const securityNamespace = await azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);

        const collection = new Array<{ securityNamespace: AzureDevOpsSecurityNamespace, id: string, token: string }>();

        const paths = this.resolvePaths(classificationNodes);
        for (const path of paths) {
            const nodes = this.resolveNodes(path, classificationNodes);
            const token = nodes.map(p => `vstfs:///Classification/Node/${p.identifier}`).join(':');

            collection.push({ securityNamespace: securityNamespace, id: path, token });
        }

        return collection;
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

    private static releaseDefinitionTokens(projectInfo: ProjectInfo, securityNamespace: AzureDevOpsSecurityNamespace, releaseDefinition: ReleaseDefinition): Array<{ securityNamespace: AzureDevOpsSecurityNamespace, id: string, token: string }>
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

            const collection = new Array<{ securityNamespace: AzureDevOpsSecurityNamespace, id: string, token: string }>();

            const rootItem = {
                securityNamespace: securityNamespace,
                id   : displayName(releaseDefinition),
                token: rootPart(projectInfo, releaseDefinition)
            };
            collection.push(rootItem);

            if (releaseDefinition.environments !== undefined) {
                for (const environment of releaseDefinition.environments) {
                    if (environment.id !== undefined) {
                        const item = {
                            securityNamespace: securityNamespace,
                            id               : displayNameEnvironment(releaseDefinition, environment),
                            token            : `${rootPart(projectInfo, releaseDefinition)}/Environment/${environment.id}`
                        };
                        collection.push(item);
                    }
                }
            }

            return collection;
        }
    }
}
