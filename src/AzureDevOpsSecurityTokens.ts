import { AzureDevOpsHelper          } from "./AzureDevOpsHelper";
import { WorkItemClassificationNode } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";

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

    static async classificationNodes(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<{ value: Array<{ path: string, token: string }> | undefined, error: Error | undefined }> {
        const depth = 10000;
        const parameters = { organization, project, depth };
        const classificationNodes = await azureDevOpsHelper.classificationNodes(parameters);
        if (classificationNodes.error !== undefined) {
            return { value: undefined, error: new Error(`Failed to resolve classificationNodes for ${JSON.stringify({ parameters })} [${classificationNodes.error}].`) }
        }
        else if (classificationNodes.value === undefined) {
            return { value: undefined, error: new Error(`Failed to resolve classificationNodes for ${JSON.stringify({ parameters })}.`) }
        }
        else {
            const collection = new Array<{ path: string, token: string }>();

            const paths = this.resolvePaths(classificationNodes.value);
            for (const path of paths) {
                const nodes = this.resolveNodes(path, classificationNodes.value);
                const token = nodes.map(p => `vstfs:///Classification/Node/${p.identifier}`).join(':');

                collection.push({ path, token });
            }

            return { value: collection, error: undefined };
        }
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
}
