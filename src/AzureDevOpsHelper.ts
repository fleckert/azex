
import axios from "axios";
import { AzureDevOpsAccessControlList                                  } from "./models/AzureDevOpsAccessControlEntry";
import { AzureDevOpsSecurityNamespace                                  } from "./models/AzureDevOpsSecurityNamespace";
import { BacklogLevelConfiguration, TeamSetting, TeamSettingsIteration } from "azure-devops-node-api/interfaces/WorkInterfaces";
import { BuildDefinitionReference                                      } from "azure-devops-node-api/interfaces/BuildInterfaces";
import { CommandRunner                                                 } from "./CommandRunner";
import { GitRepository                                                 } from "azure-devops-node-api/interfaces/GitInterfaces";
import { GraphGroup, GraphMembership, GraphSubject, GraphUser          } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Identity                                                      } from "azure-devops-node-api/interfaces/IdentitiesInterfaces";
import { TeamProjectReference, WebApiTeam                              } from "azure-devops-node-api/interfaces/CoreInterfaces";
import { ReleaseDefinition                                             } from "azure-devops-node-api/interfaces/ReleaseInterfaces";
import { WorkItemClassificationNode                                    } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { AzureDevOpsPat } from "./AzureDevOpsPat";

export class AzureDevOpsHelper {

    static async instance(tenantId: string | undefined): Promise<AzureDevOpsHelper> {
        const token = await AzureDevOpsPat.getPersonalAccessToken(tenantId);
        return new AzureDevOpsHelper(token);
    }

    private constructor(
        readonly token: string
    ) { }

    private readonly continuationTokenHeader = "x-ms-continuationtoken";

    projectsList(organization: string): Promise<TeamProjectReference[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/core/projects/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://dev.azure.com/${organization}/_apis/projects?api-version=7.1-preview.4`;
        return this.getItemsWithContinuation(url);
    }

    buildDefinitions(organization: string, project: string): Promise<BuildDefinitionReference[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/build/definitions/list?view=azure-devops-rest-7.1
        const url = `https://dev.azure.com/${organization}/${project}/_apis/build/definitions?api-version=7.1-preview.7`;
        return this.getItemsWithContinuation(url);
    }

    releaseDefinitions(organization: string, project: string): Promise<ReleaseDefinition[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/release/definitions/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vsrm.dev.azure.com/${organization}/${project}/_apis/release/definitions?api-version=7.1-preview.4&$expand=environments`;
        return this.getItemsWithContinuation(url);
    }

    graphGroupsList(organization: string): Promise<GraphGroup[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/groups/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/groups?api-version=7.1-preview.1`;
        return this.getItemsWithContinuation(url);
    }

    graphUsersList(organization: string): Promise<GraphUser[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/users/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/users?api-version=7.1-preview.1`;
        return this.getItemsWithContinuation(url);
    }

    graphGroupsListForScopeDescriptor(organization: string, scopeDescriptor: string): Promise<GraphGroup[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/groups/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/groups?scopeDescriptor=${scopeDescriptor}&api-version=7.1-preview.1`;
        return this.getItemsWithContinuation(url);
    }

    graphDescriptorForProjectId(organization: string, projectId: string): Promise<string> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/descriptors/get?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/descriptors/${projectId}?api-version=7.1-preview.1`;
        return this.getValue(url);
    }

    graphMembershipsList(organization: string, subjectDescriptor: string, direction: 'up' | 'down'): Promise<GraphMembership[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/memberships/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/Memberships/${subjectDescriptor}?direction=${direction}&api-version=7.1-preview.1`;
        return this.getValue(url);
    }

    userEntitlements(organization: string, descriptor: string): Promise<any | undefined> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/memberentitlementmanagement/user-entitlements/get?view=azure-devops-rest-7.1&tabs=HTTP
        // npm package has no definitions for this...?!?
        const url = `https://vsaex.dev.azure.com/${organization}/_apis/userentitlements/${descriptor}?api-version=7.1-preview.3`;
        return this.get(url);
    }

    teams(organization: string): Promise<WebApiTeam[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/core/teams/get-all-teams?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://dev.azure.com/${organization}/_apis/teams?api-version=7.1-preview.3`;
        return this.getValue(url);
    }

    async team(organization: string, projectName: string, teamName: string): Promise<WebApiTeam | undefined> {
        const teams = await this.teams(organization);

        return teams.find(p => p.name?.toLowerCase() === teamName.toLowerCase() && p.projectName?.toLowerCase() === projectName.toLowerCase());
    }

    classificationNodes(parameters: { organization: string, project: string, depth?: number, ids?: number[], errorPolicy?: 'omit' | 'fail' }): Promise<WorkItemClassificationNode[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/classification-nodes/get-classification-nodes?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://dev.azure.com/${parameters.organization}/${parameters.project}/_apis/wit/classificationnodes?api-version=7.1-preview.2`
                  + (parameters.depth === undefined                                ? '' : `&$depth=${parameters.depth           }`)
                  + (parameters.ids   === undefined || parameters.ids.length === 0 ? '' : `&ids=${parameters.ids.join(',')      }`)
                  + (parameters.errorPolicy === undefined                          ? '' : `&errorPolicy=${parameters.errorPolicy}`);

        return this.getValue(url);
    }

    workIterations(organization: string, project: string, team: string): Promise<TeamSettingsIteration[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/work/iterations/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://dev.azure.com/${organization}/${project}/${team}/_apis/work/teamsettings/iterations?api-version=7.1-preview.1`
        return this.getValue(url);
    }

    workBacklogs(organization: string, project: string, team: string): Promise<BacklogLevelConfiguration[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/work/backlogs/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://dev.azure.com/${organization}/${project}/${team}/_apis/work/backlogs?api-version=7.1-preview.1`;
        return this.getValue(url);
    }

    accessControlLists(query: { organization: string, securityNamespaceId: string, token?: string, descriptors?: Array<string>, includeExtendedInfo?: boolean, recurse?: boolean }): Promise<AzureDevOpsAccessControlList[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/security/access-control-lists/query?view=azure-devops-rest-7.1&tabs=HTTP
        const url =  `https://dev.azure.com/${query.organization}/_apis/accesscontrollists/${query.securityNamespaceId}?api-version=7.1-preview.1` +
                    (query.token               === undefined ? '' : `&token=${               query.token                                   }`) +
                    (query.descriptors         === undefined ? '' : `&descriptors=${         query.descriptors.join(',')                   }`) +
                    (query.includeExtendedInfo === undefined ? '' : `&includeExtendedInfo=${(query.includeExtendedInfo ? 'true' : 'false') }`) +
                    (query.recurse             === undefined ? '' : `&recurse=${            (query.recurse             ? 'true' : 'false') }`);

        return this.getValue(url);
    }

    identitiesByDescriptors(organization: string, identityDescriptors: Array<string>): Promise<Identity[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/ims/identities/read-identities?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/identities?descriptors=${identityDescriptors.join(',')}&api-version=7.1-preview.1`;
        return this.getValue(url);
    }

    identitiesBySubjectDescriptors(organization: string, subjectDescriptors: Array<string>): Promise<Identity[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/ims/identities/read-identities?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/identities?subjectDescriptors=${subjectDescriptors.join(',')}&api-version=7.1-preview.1`;
        return this.getValue(url);
    }

    async userFromIdentity(organization: string, identityDescriptor: string): Promise<GraphUser | undefined> {
        const identity = await this.identityByDescriptor(organization, identityDescriptor);
        if (identity?.subjectDescriptor === undefined) { return undefined; }
        return await this.userBySubjectDescriptor(organization, identity.subjectDescriptor);
    }

    gitRepositories(organization: string, project: string): Promise<GitRepository[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/git/repositories/list?view=azure-devops-rest-7.1&tabs=HTTP
        return this.getValue(`https://dev.azure.com/${organization}/${project}/_apis/git/repositories?api-version=7.1-preview.1`)
    }

    async identityByDescriptor(organization: string, identityDescriptor: string): Promise<Identity | undefined> {
        const identities = await this.identitiesByDescriptors(organization, [identityDescriptor]);
        if (identities.length !== 1) { return undefined; }
        return identities[0] === null ? undefined : identities[0];
    }

    async identityBySubjectDescriptor(organization: string, subjectDescriptor: string): Promise<Identity | undefined> {
        const identities = await this.identitiesBySubjectDescriptors(organization, [subjectDescriptor]);
        if (identities.length !== 1) { return undefined; }
        return identities[0] === null ? undefined : identities[0];
    }

    securityNamespaces(organization: string): Promise<AzureDevOpsSecurityNamespace[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/security/security-namespaces/query?view=azure-devops-rest-7.1&tabs=HTTP#all-security-namespaces
        return this.getValue(`https://dev.azure.com/${organization}/_apis/securitynamespaces?api-version=7.1-preview.1`);
    }

    async securityNamespaceByName(organization: string, name: string): Promise<  AzureDevOpsSecurityNamespace | undefined > {
        const response = await this.securityNamespaces(organization);

        return  response.find(p => p.name?.toLowerCase() === name.toLowerCase()) ;
    }

    async securityNamespace(organization: string, securityNamespaceId: string): Promise<AzureDevOpsSecurityNamespace | undefined> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/security/security-namespaces/query?view=azure-devops-rest-7.1&tabs=HTTP#all-security-namespaces
        const url = `https://dev.azure.com/${organization}/_apis/securitynamespaces/${securityNamespaceId}?api-version=7.1-preview.1`;

        const response = await this.getValue<AzureDevOpsSecurityNamespace[]>(url);
        if (response.length !== 1) { return undefined; }
        return response[0] === null ? undefined : response[0];
    }

    userByPrincipalName(organization: string, principalName: string): Promise<GraphSubject | undefined> {
        return this.graphSubjectQueryByPrincipalName(organization, ['User'], principalName);
    }

    userBySubjectDescriptor(organization: string, subjectDescriptor: string): Promise<GraphUser | undefined> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/users/get?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/users/${subjectDescriptor}?api-version=7.1-preview.1`;
        return this.get(url);
    }

    groupByPrincipalName(organization: string, principalName: string): Promise<GraphSubject | undefined> {
        return this.graphSubjectQueryByPrincipalName(organization, ['Group'], principalName);
    }

    async projectByName(organization: string, projectName: string): Promise<TeamProjectReference | undefined> {
        const projects = await this.projectsList(organization);

        const item = projects.find(p => p.name?.toLowerCase() === projectName.toLowerCase());

        return item;
    }

    async projectByNameOrId(organization: string, projectNameOrId: string): Promise<TeamProjectReference | undefined> {
        const projects = await this.projectsList(organization);

        const item = projects.find(
            p => p.name?.toLowerCase() === projectNameOrId.toLowerCase()
                || p.id?.toLowerCase() === projectNameOrId.toLowerCase()
        );

        return item;
    }

    async graphGroupsListForProjectName(organization: string, projectName: string): Promise<GraphGroup[]> {
        const project = await this.projectByName(organization, projectName);

        if (project?.id === undefined) {
            throw new Error(`${JSON.stringify({ organization, projectName, project, projectId: project?.id })}`);
        }

        const scopeDescriptor = await this.graphDescriptorForProjectId(organization, project.id);

        return await this.graphGroupsListForScopeDescriptor(organization, scopeDescriptor);
    }

    async graphGroupsListForProject(organization: string, projectId: string): Promise<GraphGroup[]> {
        const scopeDescriptor = await this.graphDescriptorForProjectId(organization, projectId);

        return await this.graphGroupsListForScopeDescriptor(organization, scopeDescriptor);
    }

    async graphSubjectsLookup(organization: string, descriptors: string[]): Promise<{ [id: string]: GraphSubject; }> {
        if (descriptors.length === 0) {
            return {};
        }

        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/subject-lookup/lookup-subjects?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/subjectlookup?api-version=7.1-preview.1`;
        const data = JSON.stringify({ lookupKeys: descriptors.map(descriptor => { return { descriptor } }) });
     
        try {
            const response = await axios.post(url, data, { headers: this.getHeaders() });

            if (response.status === 200) {
                return response.data.value;
            }

            throw new Error(JSON.stringify({ url, data, status: response.status, statusText: response.statusText }));
        }
        catch (error: any) {
            throw new Error(JSON.stringify({ url, data, status: error.response.status, statusText: error.response.statusText }));
        }
    }

    async graphSubjectLookup(organization: string, descriptor: string): Promise<GraphSubject | undefined> {
        const graphSubjects = await this.graphSubjectsLookup(organization, [descriptor]);

        return graphSubjects[descriptor];
    }

    async graphSubjectQueryByPrincipalName(organization: string, subjectKind: ['User'] | ['Group'] | ['User', 'Group'], principalName: string): Promise<GraphSubject | undefined> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/subject-query/query?view=azure-devops-rest-7.1
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/subjectquery?api-version=7.1-preview.1`;
        const data = JSON.stringify({
            query: `${principalName}`,
            subjectKind
        });
        try {
            const response = await axios.post(url, data, { headers: this.getHeaders() });

            if (response.status === 200) {
                if (response.data.count !== 1) { return undefined; }
                return response.data.value[0] == null ? undefined : response.data.value[0];
            }

            throw new Error(JSON.stringify({ url, data, status: response.status, statusText: response.statusText }));
        }
        catch (error: any) {
            throw new Error(JSON.stringify({ url, data, status: error.response.status, statusText: error.response.statusText }));
        }
    }

    private getHeaders() {
        const headers = {
            'Authorization': `Basic ${Buffer.from(`:${this.token}`, 'ascii').toString('base64')}`,
            //'X-VSS-ForceMsaPassThrough': 'true',
            "Content-Type": "application/json"
        }

        return headers;
    }

    private async get<T>(url: string): Promise<T> {
        try {
            const response = await axios.get(url, { headers: this.getHeaders() });

            if (response.status === 200) {
                return response.data;
            }

            throw new Error(JSON.stringify({ url, status: response.status, statusText: response.statusText }));
        }
        catch (error: any) {
            throw new Error(JSON.stringify({ url, status: error.response.status, statusText: error.response.statusText }));
        }
    }

    private async getValue<T>(url: string): Promise<T> {
        try {
            const response = await axios.get(url, { headers: this.getHeaders() });

            if (response.status === 200) {
                return response.data.value;
            }

            throw new Error(JSON.stringify({ url, status: response.status, statusText: response.statusText }));
        }
        catch (error: any) {
             throw new Error(JSON.stringify({ url, status: error.response.status, statusText: error.response.statusText }));
        }
    }

    private async getItemsWithContinuation<T>(url: string, continuationToken?: string | undefined): Promise<T[]> {
        const urlWithContinuation = continuationToken === undefined ? url : `${url}&continuationToken=${continuationToken}`;

        try {
            const response = await axios.get(urlWithContinuation, { headers: this.getHeaders() });

            if (response.status === 200) {
                const collection = new Array<T>(...response.data.value);

                if (response.headers[this.continuationTokenHeader] !== undefined) {
                    const itemsContinuation = await this.getItemsWithContinuation<T>(url, response.headers[this.continuationTokenHeader]);

                    collection.push(...itemsContinuation);
                }

                return collection;
            }

            throw new Error(JSON.stringify({ url, status: response.status, statusText: response.statusText }));
        }
        catch (error: any) {
            throw new Error(JSON.stringify({ url, status: error.response.status, statusText: error.response.statusText }));
        }
    }
}
