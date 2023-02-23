
import axios from "axios";
import { AzureDevOpsAccessControlList                                  } from "./models/AzureDevOpsAccessControlEntry";
import { AzureDevOpsSecurityNamespace                                  } from "./models/AzureDevOpsSecurityNamespace";
import { BacklogLevelConfiguration, TeamSetting, TeamSettingsIteration } from "azure-devops-node-api/interfaces/WorkInterfaces";
import { BuildDefinitionReference                                      } from "azure-devops-node-api/interfaces/BuildInterfaces";
import { CommandRunner                                                 } from "./CommandRunner";
import { GitRepository                                                 } from "azure-devops-node-api/interfaces/GitInterfaces";
import { GraphGroup, GraphMember, GraphMembership, GraphSubject, GraphUser          } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Identity                                                      } from "azure-devops-node-api/interfaces/IdentitiesInterfaces";
import { TeamProjectReference, WebApiTeam                              } from "azure-devops-node-api/interfaces/CoreInterfaces";
import { ReleaseDefinition                                             } from "azure-devops-node-api/interfaces/ReleaseInterfaces";
import { WorkItemClassificationNode                                    } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { AzureDevOpsPat } from "./AzureDevOpsPat";
import { AzureDevOpsSecurityNamespaceAction } from "./models/AzureDevOpsSecurityNamespaceAction";
import { Guid } from "./Guid";
import { Helper } from "./Helper";

export class AzureDevOpsHelper {

    static async instance(tenantId: string | undefined): Promise<AzureDevOpsHelper> {
        const token = await AzureDevOpsPat.getPersonalAccessToken(tenantId);
        return new AzureDevOpsHelper(token);
    }

    private constructor(
        readonly token: string
    ) { }

    private readonly continuationTokenHeader = "x-ms-continuationtoken";

    buildDefinitions(organization: string, project: string, count?: number): Promise<BuildDefinitionReference[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/build/definitions/list?view=azure-devops-rest-7.1
        const url = `https://dev.azure.com/${organization}/${project}/_apis/build/definitions?api-version=7.1-preview.7`;
        return this.getItemsWithContinuation(url, count);
    }

    releaseDefinitions(organization: string, project: string, count?: number): Promise<ReleaseDefinition[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/release/definitions/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vsrm.dev.azure.com/${organization}/${project}/_apis/release/definitions?api-version=7.1-preview.4&$expand=environments`;
        return this.getItemsWithContinuation(url, count);
    }

    graphGroupsList(organization: string, count?: number): Promise<GraphGroup[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/groups/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/groups?api-version=7.1-preview.1`;
        return this.getItemsWithContinuation(url, count);
    }

    graphUsersList(organization: string, count?: number): Promise<GraphUser[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/users/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/users?api-version=7.1-preview.1`;
        return this.getItemsWithContinuation(url, count);
    }

    graphGroupsListForScopeDescriptor(organization: string, scopeDescriptor: string, count?: number): Promise<GraphGroup[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/groups/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/groups?scopeDescriptor=${scopeDescriptor}&api-version=7.1-preview.1`;
        return this.getItemsWithContinuation(url, count);
    }

    graphDescriptorForProjectId(organization: string, projectId: string): Promise<string> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/descriptors/get?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/descriptors/${projectId}?api-version=7.1-preview.1`;
        return this.getValue(url);
    }

    private graphMembershipsListArgs(parameters: { organization: string, subjectDescriptor: string, direction: 'up' | 'down' }) : Promise<GraphMembership[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/memberships/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${parameters.organization}/_apis/graph/Memberships/${parameters.subjectDescriptor}?direction=${parameters.direction}&api-version=7.1-preview.1`;
        return this.getValue(url);
    }

    async graphMembershipsLists(parameters : Array<{ organization: string, subjectDescriptor: string, direction: 'up' | 'down'}>)
    {
        return this.batchCalls(
            parameters,
            p => this.graphMembershipsListArgs(p)
        );
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

    async identitiesByDescriptorExplicit(organization: string, identityDescriptors: Array<string>): Promise<Array<{ identityDescriptor: string, identity: Identity | undefined }>> {

        // requesting the identity for 'descriptor-a' may return an identity with 'descriptor-b'
        // therefore store request and response

        const collection = new Array<{ identityDescriptor: string, identity: Identity | undefined }>();

        const batchsize = 20;

        const batches = this.getBatches(identityDescriptors, batchsize);

        for (const batch of batches) {
            const requests = batch.map(identityDescriptor => { return { identityDescriptor, promise: this.identityByDescriptor(organization, identityDescriptor) } });

            for (const request of requests) {
                const result = await request.promise;
                collection.push({ identityDescriptor: request.identityDescriptor, identity: result })
            }
        }
        return collection;
    }

    async identitiesBySubjectDescriptors(organization: string, subjectDescriptors: Array<string>): Promise<Identity[]> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/ims/identities/read-identities?view=azure-devops-rest-7.1&tabs=HTTP

        const batchsize = 20;

        if (subjectDescriptors.length <= batchsize) {
            const url = `https://vssps.dev.azure.com/${organization}/_apis/identities?subjectDescriptors=${subjectDescriptors.join(',')}&api-version=7.1-preview.1`;
            return await this.getValue(url);
        }
        else {
            const batches = this.getBatches(subjectDescriptors, batchsize);

            const collection = new Array<Identity>()
            for (const batch of batches) {
                const tmp = await this.identitiesBySubjectDescriptors(organization, batch);

                collection.push(...tmp);
            }

            return collection;
        }
    }

    async userFromIdentity(organization: string, identityDescriptor: string): Promise<GraphUser | undefined> {
        const identity = await this.identityByDescriptor(organization, identityDescriptor);
        if (identity?.subjectDescriptor === undefined) { return undefined; }

        return await this.userBySubjectDescriptor(organization, identity.subjectDescriptor);
    }

    async groupFromIdentity(organization: string, identityDescriptor: string): Promise<GraphGroup | undefined> {
        const identity = await this.identityByDescriptor(organization, identityDescriptor);
        if (identity?.subjectDescriptor === undefined) { return undefined; }

        return await this.groupBySubjectDescriptor(organization, identity.subjectDescriptor);
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

    static azureDevOpsAccessControlEntryMapping(securityNamespace: AzureDevOpsSecurityNamespace, value: number | undefined): Array<AzureDevOpsSecurityNamespaceAction> {
        if (value === undefined) {
            return [];
        }

        const actions = new Array<AzureDevOpsSecurityNamespaceAction>();

        for (const action of securityNamespace.actions) {
            if (action.bit === undefined) {
                continue;
            }

            const isMatch = (action.bit & value) === action.bit;

            if (isMatch) {
                actions.push(action);
            }
        }

        return actions;
    }

    async securityNamespaceByName(organization: string, name: string): Promise<AzureDevOpsSecurityNamespace> {
        const securityNamespaces = await this.securityNamespaces(organization);

        const securityNamespace = securityNamespaces.find(p => p.name?.toLowerCase() === name.toLowerCase());

        if (securityNamespace === undefined) {
            throw new Error(JSON.stringify({ organization, name, securityNamespaces, error: `Failed to resolve securityNamespace with name '${name}'.` }));
        }

        return securityNamespace;
    }

    async securityNamespace(organization: string, securityNamespaceId: string): Promise<AzureDevOpsSecurityNamespace | undefined> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/security/security-namespaces/query?view=azure-devops-rest-7.1&tabs=HTTP#all-security-namespaces
        const url = `https://dev.azure.com/${organization}/_apis/securitynamespaces/${securityNamespaceId}?api-version=7.1-preview.1`;

        const response = await this.getValue<AzureDevOpsSecurityNamespace[]>(url);
        if (response.length !== 1) { return undefined; }
        return response[0] === null ? undefined : response[0];
    }

    userBySubjectDescriptor(organization: string, subjectDescriptor: string): Promise<GraphUser | undefined> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/users/get?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/users/${subjectDescriptor}?api-version=7.1-preview.1`;
        return this.get(url);
    }

    groupBySubjectDescriptor(organization: string, groupDescriptor: string): Promise<GraphGroup | undefined> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/groups/get?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/groups/${groupDescriptor}?api-version=7.1-preview.1`;
        return this.get(url);
    }

    groupByPrincipalName(organization: string, principalName: string): Promise<GraphSubject | undefined> {
        return this.graphSubjectQueryByPrincipalName(organization, ['Group'], principalName);
    }

    project(organization: string, projectNameOrId: string): Promise<TeamProjectReference | undefined> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/core/projects/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://dev.azure.com/${organization}/_apis/projects?api-version=7.1-preview.4`;
        const predicate = (p: TeamProjectReference) => p.name?.toLowerCase() === projectNameOrId.toLowerCase()
                                                    || p.id?.  toLowerCase() === projectNameOrId.toLowerCase();

        return this.getItemsWithContinuationAndBreak(url, predicate);
    }

    async graphGroupsListForProjectName(organization: string, projectName: string, count?: number): Promise<GraphGroup[]> {
        const project = await this.project(organization, projectName);

        if (project?.id === undefined) {
            throw new Error(`${JSON.stringify({ organization, projectName, project, error:'Failed to resolve project.id.' })}`);
        }

        const scopeDescriptor = await this.graphDescriptorForProjectId(organization, project.id);

        return await this.graphGroupsListForScopeDescriptor(organization, scopeDescriptor, count);
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
                if (response.data.count === 0) {
                    return undefined;
                }
                else if (response.data.count === 1) {
                    return response.data.value[0] == null ? undefined : response.data.value[0];
                }
                else{
                    const item = response.data.value.find((p: { principalName: string | undefined }) => p.principalName?.toLowerCase() === principalName.toLocaleLowerCase());

                    return item;
                }
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

    private async getItemsWithContinuation<T>(url: string, count?: number): Promise<T[]> {
        const collection = new Array<T>();

        let continuationToken: string | undefined = undefined;

        while (true) {
            const urlWithContinuation: string = continuationToken === undefined ? url : `${url}&continuationToken=${continuationToken}`;

            try {
                const response = await axios.get(urlWithContinuation, { headers: this.getHeaders() });

                if (response.status === 200) {
                    collection.push(...response.data.value);

                    if (response.headers[this.continuationTokenHeader] === undefined) {
                        break;
                    }
                    else {
                        continuationToken = response.headers[this.continuationTokenHeader];
                    }
                    
                    if(count !== undefined && collection.length >= count){
                        break;
                    }
                }
                else {
                    throw new Error(JSON.stringify({ url, status: response.status, statusText: response.statusText }));
                }
            }
            catch (error: any) {
                throw new Error(JSON.stringify({ url, status: error.response.status, statusText: error.response.statusText }));
            }
        }

        return collection.slice(0, count);
    }

    private async getItemsWithContinuationAndBreak<T>(url: string, predicate: (value: T) => boolean): Promise<T | undefined> {
        let continuationToken: string | undefined = undefined;

        while (true) {
            const urlWithContinuation: string = continuationToken === undefined ? url : `${url}&continuationToken=${continuationToken}`;

            try {
                const response = await axios.get(urlWithContinuation, { headers: this.getHeaders() });

                if (response.status === 200) {
                    const collection = new Array<T>();

                    collection.push(...response.data.value);
                    
                    const item = collection.find(predicate);

                    if(item !== undefined){
                        return item;
                    }

                    if (response.headers[this.continuationTokenHeader] === undefined) {
                        return undefined;
                    }

                    continuationToken = response.headers[this.continuationTokenHeader];
                }
                else {
                    throw new Error(JSON.stringify({ url, status: response.status, statusText: response.statusText }));
                }
            }
            catch (error: any) {
                throw new Error(JSON.stringify({ url, status: error.response.status, statusText: error.response.statusText }));
            }
        }
    }

    private getBatches<T>(values: T[], batchSize: number): Array<Array<T>> {
        const batches = new Array<Array<T>>();
        batches.push(new Array<T>());

        for (let index = 0; index < values.length; index++) {
            if (batches[batches.length - 1].length == batchSize) {
                batches.push(new Array<T>());
            }

            batches[batches.length - 1].push(values[index]);
        }

        return batches;
    }

    private async batchCalls<TParameters, TResult>(parametersCollection: TParameters[], func: (parameters: TParameters) => Promise<TResult>, batchsize? : number): Promise<Array<{ parameters: TParameters, result: TResult }>> {
        const batches = this.getBatches(parametersCollection, batchsize ?? 10);

        const collection = new Array<{ parameters: TParameters, result: TResult }>();

        for (const batch of batches) {
            const promises = batch.map(p => { return { parameters: p, promise: func(p) } });

            for (const promise of promises) {
                collection.push({
                    parameters: promise.parameters,
                    result    : await promise.promise
                });
            }
        }

        return collection;
    }
}
