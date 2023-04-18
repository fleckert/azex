import { AzureDevOpsSecurityTokenElement } from "./AzureDevOpsSecurityTokens";
import { TeamProjectReference            } from "azure-devops-node-api/interfaces/CoreInterfaces";

export class AzureDevOpsSecurityTokenParser {
    static getProject(namespaceName: string, token: string, projects: TeamProjectReference[], securityTokens: Array<AzureDevOpsSecurityTokenElement>): TeamProjectReference | undefined {
        if (namespaceName === 'CSS') {
            return AzureDevOpsSecurityTokenParser.getProject_CSS(token, projects, securityTokens);
        }
        if (namespaceName === 'Git Repositories') {
            return AzureDevOpsSecurityTokenParser.getProject_GitRepositories(token, projects);
        }
        if (namespaceName === 'Identity') {
            return AzureDevOpsSecurityTokenParser.getProject_Identity(token, projects);
        }
        if (namespaceName === 'Iteration') {
            return AzureDevOpsSecurityTokenParser.getProject_Iteration(token, projects, securityTokens);
        }
        if (namespaceName === 'DashboardsPrivileges') {
            return AzureDevOpsSecurityTokenParser.getProject_DashboardsPrivileges(token, projects);
        }
        return undefined;
    }

    private static getProject_CSS(token: string, projects: TeamProjectReference[], securityTokens: Array<AzureDevOpsSecurityTokenElement>): TeamProjectReference | undefined {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#internal-namespaces-and-permissions
        if (token.startsWith('vstfs:///Classification/Node/') === false) {
            return undefined;
        }
        const indexOfColon = token.indexOf(':', 'vstfs:///Classification/Node/'.length);

        const tokenStripped = token.substring('vstfs:///Classification/Node/'.length, indexOfColon < 0 ? undefined : indexOfColon);

        const project = projects.find(p => p.id === tokenStripped);

        if (project !== undefined) {
            return project;
        }

        const projectNames = [...new Set<string>(
            securityTokens
            .filter(p => p.securityNamespace.name === 'CSS')
            .filter(p => p.token.startsWith(`vstfs:///Classification/Node/${tokenStripped}`))
            .filter(p => p.project?.name !== undefined)
            .map   (p => p.project?.name!)
        )];

        if (projectNames.length === 1) {
            return projects.find(p => p.name?.toLowerCase() === projectNames[0].toLowerCase());
        }
        return undefined;
    }

    private static getProject_GitRepositories(token: string, projects: TeamProjectReference[]): TeamProjectReference | undefined {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#internal-namespaces-and-permissions
        if (token.startsWith('repoV2/') === false) {
            return undefined;
        }

        const tokenStripped = token.split('/')[1];

        return projects.find(p => p.id === tokenStripped);
    }

    private static getProject_Identity(token: string, projects: TeamProjectReference[]): TeamProjectReference | undefined {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#internal-namespaces-and-permissions
        const projectId = token.split('\\')[0];

        return projects.find(p => p.id === projectId);
    }

    private static getProject_Iteration(token: string, projects: TeamProjectReference[], securityTokens: Array<AzureDevOpsSecurityTokenElement>): TeamProjectReference | undefined {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#internal-namespaces-and-permissions
        if (token.startsWith('vstfs:///Classification/Node/') === false) {
            return undefined;
        }
        const indexOfColon = token.indexOf(':', 'vstfs:///Classification/Node/'.length);

        const tokenStripped = token.substring('vstfs:///Classification/Node/'.length, indexOfColon < 0 ? undefined : indexOfColon);

        const project = projects.find(p => p.id === tokenStripped);

        if (project !== undefined) {
            return project;
        }

        const projectNames = [...new Set<string>(
            securityTokens
            .filter(p => p.securityNamespace.name === 'Iteration')
            .filter(p => p.token.startsWith(`vstfs:///Classification/Node/${tokenStripped}`))
            .filter(p => p.project?.name !== undefined)
            .map   (p => p.project?.name!)
        )];

        if (projectNames.length === 1) {
            return projects.find(p => p.name?.toLowerCase() === projectNames[0].toLowerCase());
        }
        return undefined;
    }

    private static getProject_DashboardsPrivileges(token: string, projects: TeamProjectReference[]): TeamProjectReference | undefined {
        // https://learn.microsoft.com/en-us/azure/devops/organizations/security/namespace-reference?view=azure-devops#internal-namespaces-and-permissions
        if (token.startsWith('$/') === false) {
            return undefined;
        }

        const tokenStripped = token.split('/')[1];

        return projects.find(p => p.id === tokenStripped);
    }
}
