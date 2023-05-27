import { AzureDevOpsHelper                                                     } from "./AzureDevOpsHelper";
import { AzureDevOpsSecurityNamespace                                          } from "./models/AzureDevOpsSecurityNamespace";
import { Helper                                                                } from "./Helper";
import { QueryHierarchyItem, TreeNodeStructureType, WorkItemClassificationNode } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { ReleaseDefinition, ReleaseDefinitionEnvironment                       } from "azure-devops-node-api/interfaces/ReleaseInterfaces";
import { TeamProjectReference                                                  } from "azure-devops-node-api/interfaces/CoreInterfaces";

export interface AzureDevOpsSecurityTokenElement {
    securityNamespace: AzureDevOpsSecurityNamespace
    id               : string
    token            : string
    project          : TeamProjectReference | undefined
}

export class AzureDevOpsSecurityTokens {
    static GitRepositories_Project                  (projectId: string                                          ) { return `repoV2/${projectId}`                ; }
    static GitRepositories_Project_Repository       (projectId: string, repositoryId: string                    ) { return `repoV2/${projectId}/${repositoryId}`; }
    static GitRepositories_Project_Repository_Branch(projectId: string, repositoryId: string, branchName: string) {
        const parts = branchName.split('/');

        const firstTwoSegments = parts.slice(0, 2);
        const otherSegments = parts.slice(2).map(p => AzureDevOpsSecurityTokens.encode(p));

        const partsEncoded = firstTwoSegments.concat(otherSegments).join('/');

        return `repoV2/${projectId}/${repositoryId}/${partsEncoded}`;
    }

    static async all(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        const analytics            = AzureDevOpsSecurityTokens.analytics           (azureDevOpsHelper, organization, project);
        const analyticsViews       = AzureDevOpsSecurityTokens.analyticsViews      (azureDevOpsHelper, organization, project);
        const auditLog             = AzureDevOpsSecurityTokens.auditLog            (azureDevOpsHelper, organization, project);
        const buildDefinitions     = AzureDevOpsSecurityTokens.buildDefinitions    (azureDevOpsHelper, organization, project);
        const classificationNodes  = AzureDevOpsSecurityTokens.classificationNodes (azureDevOpsHelper, organization, project);
        const dashboardsPrivileges = AzureDevOpsSecurityTokens.dashboardsPrivileges(azureDevOpsHelper, organization, project);
        const environment          = AzureDevOpsSecurityTokens.environment         (azureDevOpsHelper, organization, project);
        const gitRepositories      = AzureDevOpsSecurityTokens.gitRepositories     (azureDevOpsHelper, organization, project);
        const identity             = AzureDevOpsSecurityTokens.identity            (azureDevOpsHelper, organization, project);
        const library              = AzureDevOpsSecurityTokens.library             (azureDevOpsHelper, organization, project);
        const plan                 = AzureDevOpsSecurityTokens.plan                (azureDevOpsHelper, organization, project);
        const prjct                = AzureDevOpsSecurityTokens.project             (azureDevOpsHelper, organization, project);
        const process              = AzureDevOpsSecurityTokens.process             (azureDevOpsHelper, organization, project);
        const releaseManagement    = AzureDevOpsSecurityTokens.releaseManagement   (azureDevOpsHelper, organization, project);
        const tagging              = AzureDevOpsSecurityTokens.tagging             (azureDevOpsHelper, organization, project);
        const workItemQueryFolders = AzureDevOpsSecurityTokens.workItemQueryFolders(azureDevOpsHelper, organization, project);

        const collection = new Array<AzureDevOpsSecurityTokenElement>();

        try { collection.push(...await analytics           ) }catch{}
        try { collection.push(...await analyticsViews      ) }catch{}
        try { collection.push(...await auditLog            ) }catch{}
        try { collection.push(...await buildDefinitions    ) }catch{}
        try { collection.push(...await classificationNodes ) }catch{}
        try { collection.push(...await dashboardsPrivileges) }catch{}
        try { collection.push(...await environment         ) }catch{}
        try { collection.push(...await gitRepositories     ) }catch{}
        try { collection.push(...await identity            ) }catch{}
        try { collection.push(...await library             ) }catch{}
        try { collection.push(...await plan                ) }catch{}
        try { collection.push(...await prjct               ) }catch{}
        try { collection.push(...await process             ) }catch{}
        try { collection.push(...await releaseManagement   ) }catch{}
        try { collection.push(...await tagging             ) }catch{}
        try { collection.push(...await workItemQueryFolders) }catch{}

        collection.sort(
            (a: AzureDevOpsSecurityTokenElement, b: AzureDevOpsSecurityTokenElement) =>
                `${a.securityNamespace.displayName}-${a.id}`.toLowerCase().localeCompare(`${b.securityNamespace.displayName}-${b.id}`.toLowerCase())
        );

        return collection;
    }

    static async analyticsViews(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#object-level-namespaces-and-permissions
        const securityNamespaceName = 'AnalyticsViews';
        const securityNamespacePromise = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);

        const prjct = await azureDevOpsHelper.project(organization, project);
        if (prjct?.id === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.id.' }));
        }

        const securityNamespace = await securityNamespacePromise;

        const value = new Array<AzureDevOpsSecurityTokenElement>({
            securityNamespace: securityNamespace,
            id               : `/${prjct.name}`,
            token            : `$/Shared/${prjct.id}`,
            project          : prjct
        });

        return value;
    }

    static async analytics(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#internal-namespaces-and-permissions
        const securityNamespaceName = 'Analytics';
        const securityNamespacePromise = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);


        const prjct = await azureDevOpsHelper.project(organization, project);
        if (prjct?.id === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.id.' }));
        }

        const securityNamespace = await securityNamespacePromise;

        const value = new Array<AzureDevOpsSecurityTokenElement>({
            securityNamespace: securityNamespace,
            id               : `/${prjct.name}`,
            token            : `$/${prjct.id}`,
            project          : prjct
        });

        return value;
    }

    static async auditLog(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#organization-level-namespaces-and-permissions
        const securityNamespaceName = 'AuditLog';
        const securityNamespacePromise = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);

        const securityNamespace = await securityNamespacePromise;

        const value = new Array<AzureDevOpsSecurityTokenElement>({
            securityNamespace: securityNamespace,
            id               : `AllPermissions`,
            token            : 'AllPermissions',
            project          : undefined
        });

        return value;
    }

    static async dashboardsPrivileges(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#object-level-namespaces-and-permissions
        const securityNamespaceName = 'DashboardsPrivileges';
        const securityNamespacePromise    = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);
        const dashboardsForProjectPromise = azureDevOpsHelper.dashboards             (organization, project              );

        const prjct = await azureDevOpsHelper.project(organization, project);
        if (prjct?.id === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.' }));
        }

        const teams = await azureDevOpsHelper.teamsInProject(organization, prjct.id);
        const parameters = teams.map(team => { return { organization, project: prjct, team }; })
        const dashboardsForTeams = await Helper.batchCalls(parameters, p => azureDevOpsHelper.dashboards(p.organization, `${p.project.id}`, `${p.team.id}`));

        const securityNamespace = await securityNamespacePromise;

        const value = new Array<AzureDevOpsSecurityTokenElement>();

        for (const dashboard of dashboardsForTeams) {
            for (const result of dashboard.result) {
                value.push({
                    securityNamespace: securityNamespace,
                    id               : `/${dashboard.parameters.project.name}/${dashboard.parameters.team.name}/${result.name}`,
                    token            : `$/${dashboard.parameters.project.id}/${dashboard.parameters.team.id}/${result.id}`,
                    project          : prjct
                });
            }
        }

        const dashboardsForProject = await dashboardsForProjectPromise;

        for (const dashboard of dashboardsForProject.filter(p => `${p.dashboardScope}` === 'project')) {
            value.push({
                securityNamespace: securityNamespace,
                id               : `/${prjct.name}/${dashboard.name}`,
                token            : `$/${prjct.id}/00000000-0000-0000-0000-000000000000/${dashboard.id}`,
                project          : prjct
            });
        }

        for (const team of teams) {
            value.push({
                securityNamespace: securityNamespace,
                id               : `/${prjct.name}/${team.name}`,
                token            : `$/${prjct.id}/${team.id}`,
                project          : prjct
            });
        }

        value.push({
            securityNamespace: securityNamespace,
            id               : `/${prjct.name}`,
            token            : `$/${prjct.id}`,
            project          : prjct
        });

        return value;
    }

    static async environment(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#role-based-namespaces-and-permissions
        const securityNamespaceName = 'Environment';
        const securityNamespacePromise = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);
        const environmentsPromise      = azureDevOpsHelper.environments           (organization, project              );

        const prjct = await azureDevOpsHelper.project(organization, project);
        if (prjct?.id === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.' }));
        }

        const environments      = await environmentsPromise;
        const securityNamespace = await securityNamespacePromise;

        const value = new Array<AzureDevOpsSecurityTokenElement>();

        for (const environment of environments) {
            value.push({
                securityNamespace: securityNamespace,
                id               : `/Environments/${prjct.name}/${environment.name}`,
                token            : `Environments/${environment.id}`,
                project          : prjct
            }); 
        }
 
        return value;
    }

    static async plan(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#object-level-namespaces-and-permissions
        const securityNamespaceName = 'Plan';
        const securityNamespacePromise = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);

        const prjct = await azureDevOpsHelper.project(organization, project);
        if (prjct?.id === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.' }));
        }

        const plans = await azureDevOpsHelper.plans(organization, prjct?.id);

        const securityNamespace = await securityNamespacePromise;

        const value = new Array<AzureDevOpsSecurityTokenElement>({
            securityNamespace: securityNamespace,
            id               : `/${prjct.name}`,
            token            : `Plan/${prjct.id}`,
            project          : prjct
        });

        value.push(...plans.map(plan => { return {
            securityNamespace: securityNamespace,
            id               : `/${prjct.name}/${plan.name}`,
            token            : `Plan/${prjct.id}/${plan.id}`,
            project          : prjct
        }}));

        return value;
    }

    static async library(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        //https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#role-based-namespaces-and-permissions
        const securityNamespaceName = 'Library';
        const securityNamespacePromise = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);

        const prjct = await azureDevOpsHelper.project(organization, project);
        if (prjct?.id === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.' }));
        }

        const securityNamespace = await securityNamespacePromise;

        const value = new Array<AzureDevOpsSecurityTokenElement>({
            securityNamespace: securityNamespace,
            id               : `/${prjct.name}`,
            token            : prjct.id,
            project          : prjct
        });

        // todo permissions for library items

        return value;
    }

    static async workItemQueryFolders(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#object-level-namespaces-and-permissions
        const securityNamespaceName = 'WorkItemQueryFolders';
        const securityNamespacePromise = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);

        const prjct = await azureDevOpsHelper.project(organization, project);
        if (prjct?.id === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.' }));
        }

        const workItemQueryFolders = await azureDevOpsHelper.workItemQueryFolders(organization, prjct?.id, 2, 'none');

        const workItemQueryFoldersFlat  = AzureDevOpsSecurityTokens.flattenWorkItemQueryFolders(workItemQueryFolders, undefined);

        const securityNamespace = await securityNamespacePromise;

        const value = workItemQueryFoldersFlat.map(p => { return {
            securityNamespace: securityNamespace,
            id               : `/${prjct.name}/${p.item.path}`,
            token            : `$/${prjct.id}${p.parent === undefined ? '' : `/${p.parent}`}/${p.item.id}`,
            project          : prjct
        }});

        return value;
    }

    private static flattenWorkItemQueryFolders(items: QueryHierarchyItem[], parent: string | undefined): Array<{ parent: string | undefined, item: QueryHierarchyItem }> {
        const collection = new Array<{ parent: string | undefined, item: QueryHierarchyItem }>();

        for (const item of items) {
            collection.push({ parent, item });

            if (item.children !== undefined) {
                collection.push(...AzureDevOpsSecurityTokens.flattenWorkItemQueryFolders(item.children, `${parent === undefined ? '' : `${parent}/`}${item.id}`));
            }
        }

        return collection;
    }

    static async identity(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#internal-namespaces-and-permissions
        const securityNamespaceName = 'Identity';
        const securityNamespacePromise = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);

        const prjct = await azureDevOpsHelper.project(organization, project);
        if (prjct?.id === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.id.' }));
        }

        const securityNamespace = await securityNamespacePromise;

        const value = new Array<AzureDevOpsSecurityTokenElement>({
            securityNamespace: securityNamespace,
            id               : `${prjct.name}`,
            token            : prjct.id,
            project          : prjct
        });

        const teams = await azureDevOpsHelper.teamsInProject(organization, prjct.id);
        for (const team of teams) {
            value.push({
                securityNamespace: securityNamespace,
                id               : `${prjct.name}\\${team.name}`,
                token            : `${prjct.id}\\${team.id}`,
                project          : prjct
            });
        }

        if (prjct.name !== undefined) {
            const groups = await azureDevOpsHelper.graphGroupsListForProjectName(organization, prjct.name);
            for (const group of groups) {
                if (group.originId === undefined) {
                    continue
                }

                value.push({
                    securityNamespace: securityNamespace,
                    id: `${group.principalName}`,
                    token: `${prjct.id}\\${group.originId}`,
                    project: prjct
                });
            }
        }

        return value;
    }

    static async gitRepositories(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        const securityNamespaceName = 'Git Repositories';
        const securityNamespacePromise = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);
        const gitRepositoriesPromise   = azureDevOpsHelper.gitRepositories        (organization, project);

        const prjct = await azureDevOpsHelper.project(organization, project);
        if (prjct?.id === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.' }));
        }
        const gitRepositories = await gitRepositoriesPromise;
        const securityNamespace = await securityNamespacePromise;

        const rootValue = {
            securityNamespace: securityNamespace,
            id               : `/${prjct.name} (all)`,
            token            : AzureDevOpsSecurityTokens.GitRepositories_Project(prjct.id),
            project          : prjct
        }
        const value = gitRepositories.map(
            p => {
                return {
                    securityNamespace: securityNamespace,
                    id               : `/${prjct.name}/${p.name}`,
                    token            : AzureDevOpsSecurityTokens.GitRepositories_Project_Repository(prjct.id!, p.id ?? ''),
                    project          : prjct
                }
            });

        return [rootValue, ...value];
    }

    static async project(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#project-level-namespaces-and-permissions
        const securityNamespaceName = 'Project';
        const securityNamespacePromise = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);

        const prjct = await azureDevOpsHelper.project(organization, project);
        if (prjct?.id === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.' }));
        }

        const securityNamespace = await securityNamespacePromise;

        const value = new Array<AzureDevOpsSecurityTokenElement>({
            securityNamespace: securityNamespace,
            id               : `/${prjct.name}`,
            token            : `$PROJECT:vstfs:///Classification/TeamProject/${prjct.id}`,
            project          : prjct
        });

        return value;
    }

    static async process(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#organization-level-namespaces-and-permissions
        const securityNamespaceName = 'Process';
        const securityNamespacePromise = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);

        const securityNamespace = await securityNamespacePromise;

        const value = new Array<AzureDevOpsSecurityTokenElement>();

        if (securityNamespace.namespaceId !== undefined) {
            const processes = await azureDevOpsHelper.processes(organization);

            const accessControlLists = await azureDevOpsHelper.accessControlLists({ organization, securityNamespaceId: securityNamespace.namespaceId });

            const tokens = accessControlLists.map(p => p.token).filter(p => p !== undefined).map(p=>p!);

            for (const token of tokens) {
                const tokenParts = token.split(':');

                const ids = tokenParts.map(tokenPart => {
                    const mapped = new Array<string>();
                    if (tokenPart === '$PROCESS') {
                        mapped.push('$PROCESS');
                    }
                    else {
                        const process = processes.find(process => process.id === tokenPart);

                        if (process?.name !== undefined) {
                            mapped.push(process.name);
                        }
                        else{
                            mapped.push(tokenPart);
                        }
                    }

                    return mapped;
                });

                value.push({
                    securityNamespace: securityNamespace,
                    id               : ids.join(':'),
                    token            : token,
                    project          : undefined
                });
            }
        }
        return value;
    }

    static async tagging(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#project-level-namespaces-and-permissions
        const securityNamespaceName = 'Tagging';
        const securityNamespacePromise = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);

        const prjct = await azureDevOpsHelper.project(organization, project);
        if (prjct?.id === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.' }));
        }

        const securityNamespace = await securityNamespacePromise;

        const value = new Array<AzureDevOpsSecurityTokenElement>({
            securityNamespace: securityNamespace,
            id               : `/${prjct.name}`,
            token            : `/${prjct.id}`,
            project          : prjct
        });

        return value; 
    }

    static async buildDefinitions(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#object-level-namespaces-and-permissions
        const securityNamespaceName = 'BuildAdministration';
        const securityNamespacePromise = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);
        const buildDefinitionsPromise  = azureDevOpsHelper.buildDefinitions       (organization, project              );

        const prjct = await azureDevOpsHelper.project(organization, project);
        if (prjct?.id === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.' }));
        }

        const collection        = await buildDefinitionsPromise;
        const securityNamespace = await securityNamespacePromise;

        const value = collection.map(p => {
            return {
                securityNamespace: securityNamespace,
                id               : `/${prjct.name}/${p.name}`,
                token            : `${prjct.id   }/${p.id  }`,
                project          : prjct
            }
        });

        return value;
    }

    static async releaseManagement(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        const securityNamespaceName = 'ReleaseManagement';
        const securityNamespacePromise  = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);
        const releaseDefinitionsPromise = azureDevOpsHelper.releaseDefinitions     (organization, project              );

        const prjct = await azureDevOpsHelper.project(organization, project);
        if (prjct === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.' }));
        }

        const collection = await releaseDefinitionsPromise;
        const securityNamespace = await securityNamespacePromise;

        const value = new Array<AzureDevOpsSecurityTokenElement>();

        for (const item of collection) {
            const items = AzureDevOpsSecurityTokens.releaseDefinitionTokens(prjct, securityNamespace, item);

            value.push(...items);
        }

        return value;
    }

    static async classificationNodes(azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string): Promise<Array<AzureDevOpsSecurityTokenElement>> {
        const securityNamespaceNameCSS = 'CSS';
        const securityNamespaceNameIteration = 'Iteration';
        const depth = 10000;
        const securityNamespaceCSSPromise       = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceNameCSS      );
        const securityNamespaceIterationPromise = azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceNameIteration);

        const prjct = await azureDevOpsHelper.project(organization, project);
        if (prjct === undefined) {
            throw new Error(JSON.stringify({ organization, project, error: 'Failed to resolve project.' }));
        }

        const classificationNodes = await azureDevOpsHelper.classificationNodes({ organization, project, depth });
        const paths = AzureDevOpsSecurityTokens.resolvePaths(classificationNodes);
        
        const securityNamespaceCSS       = await securityNamespaceCSSPromise;
        const securityNamespaceIteration = await securityNamespaceIterationPromise;

        const collection = new Array<AzureDevOpsSecurityTokenElement>();
        for (const path of paths) {
            const nodes = AzureDevOpsSecurityTokens.resolveNodes(path.path, classificationNodes);
            const token = nodes.map(p => `vstfs:///Classification/Node/${p.identifier}`).join(':');
            // fix enum comparison
            if (`${path.structureType}`.toLowerCase() === 'area') {
                collection.push({ 
                    securityNamespace: securityNamespaceCSS, 
                    id               : path.path.replaceAll('\\', '/'), 
                    token            : token,
                    project          : prjct
                });
            }
            else if (`${path.structureType}`.toLowerCase() === 'iteration') {
                collection.push({ 
                    securityNamespace: securityNamespaceIteration, 
                    id               : path.path.replaceAll('\\', '/'), 
                    token            : token ,
                    project          : prjct
                });
            }
            else {
                throw new Error(JSON.stringify({ path }));
            }
        }

        return collection;
    }

    private static resolvePaths(nodes: WorkItemClassificationNode[]): { path: string, structureType: TreeNodeStructureType }[] {
        const paths = new Array<{ path: string, structureType: TreeNodeStructureType }>();

        for (const node of nodes) {
            if (node.path !== undefined && node.structureType !== undefined) {
                paths.push({ path: node.path, structureType: node.structureType });
            }
            if (node.children !== undefined) {
                const childPaths = AzureDevOpsSecurityTokens.resolvePaths(node.children);

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
            return [node, ...AzureDevOpsSecurityTokens.resolveNodes(path, node.children)];
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

    private static releaseDefinitionTokens(projectInfo: TeamProjectReference, securityNamespace: AzureDevOpsSecurityNamespace, releaseDefinition: ReleaseDefinition): Array<AzureDevOpsSecurityTokenElement>
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

            const rootPart = (prjtInfo: TeamProjectReference, rd: ReleaseDefinition): string => {
                const fldrNm = folderName(rd);

                const value = `${prjtInfo.id}${fldrNm}${rd.id}`;
                return value;
            }

            const collection = new Array<AzureDevOpsSecurityTokenElement>();

            const rootItem = {
                securityNamespace: securityNamespace,
                id               : displayName(releaseDefinition),
                token            : rootPart(projectInfo, releaseDefinition),
                project          : projectInfo
            };
            collection.push(rootItem);

            if (releaseDefinition.environments !== undefined) {
                for (const environment of releaseDefinition.environments) {
                    if (environment.id !== undefined) {
                        const item = {
                            securityNamespace: securityNamespace,
                            id               : displayNameEnvironment(releaseDefinition, environment),
                            token            : `${rootPart(projectInfo, releaseDefinition)}/Environment/${environment.id}`,
                            project          : projectInfo
                        };
                        collection.push(item);
                    }
                }
            }

            return collection;
        }
    }
}
