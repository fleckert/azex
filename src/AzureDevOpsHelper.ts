
import axios from "axios";
import { AzureDevOpsAccessControlList                                  } from "./models/AzureDevOpsAccessControlEntry";
import { AzureDevOpsSecurityNamespace                                  } from "./models/AzureDevOpsSecurityNamespace";
import { BacklogLevelConfiguration, TeamSetting, TeamSettingsIteration } from "azure-devops-node-api/interfaces/WorkInterfaces";
import { BuildDefinitionReference                                      } from "azure-devops-node-api/interfaces/BuildInterfaces";
import { CommandRunner                                                 } from "./CommandRunner";
import { GitRepository                                                 } from "azure-devops-node-api/interfaces/GitInterfaces";
import { GraphGroup, GraphMembership, GraphSubject, GraphUser          } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Identity                                                      } from "azure-devops-node-api/interfaces/IdentitiesInterfaces";
import { ProjectInfo, WebApiTeam                                       } from "azure-devops-node-api/interfaces/CoreInterfaces";
import { ReleaseDefinition                                             } from "azure-devops-node-api/interfaces/ReleaseInterfaces";
import { WorkItemClassificationNode                                    } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";

export class AzureDevOpsHelper {

    private readonly continuationTokenHeader = "x-ms-continuationtoken";

    projectsList(organization: string): Promise<{ value: ProjectInfo[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/core/projects/list?view=azure-devops-rest-7.1&tabs=HTTP
        return this.getItemsWithContinuation(`https://dev.azure.com/${organization}/_apis/projects?api-version=7.1-preview.4`);
    }

    buildDefinitions(organization: string, project:string): Promise<{ value: BuildDefinitionReference[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/build/definitions/list?view=azure-devops-rest-7.1
        return this.getItemsWithContinuation(`https://dev.azure.com/${organization}/${project}/_apis/build/definitions?api-version=7.1-preview.7`);
    }

    releaseDefinitions(organization: string, project:string): Promise<{ value: ReleaseDefinition[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/release/definitions/list?view=azure-devops-rest-7.1&tabs=HTTP

        return this.getItemsWithContinuation(`https://vsrm.dev.azure.com/${organization}/${project}/_apis/release/definitions?api-version=7.1-preview.4&$expand=environments`);
    }

    graphGroupsList(organization: string): Promise<{ value: GraphGroup[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/groups/list?view=azure-devops-rest-7.1&tabs=HTTP
        return this.getItemsWithContinuation(`https://vssps.dev.azure.com/${organization}/_apis/graph/groups?api-version=7.1-preview.1`);
    }

    graphUsersList(organization: string): Promise<{ value: GraphUser[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/users/list?view=azure-devops-rest-7.1&tabs=HTTP
        return this.getItemsWithContinuation(`https://vssps.dev.azure.com/${organization}/_apis/graph/users?api-version=7.1-preview.1`);
    }

    graphGroupsListForScopeDescriptor(organization: string, scopeDescriptor: string): Promise<{ value: GraphGroup[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/groups/list?view=azure-devops-rest-7.1&tabs=HTTP
        return this.getItemsWithContinuation(`https://vssps.dev.azure.com/${organization}/_apis/graph/groups?scopeDescriptor=${scopeDescriptor}&api-version=7.1-preview.1`);
    }

    graphDescriptorForProjectId(organization: string, projectId: string): Promise<{ value: string | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/descriptors/get?view=azure-devops-rest-7.1&tabs=HTTP
        return this.getValue(`https://vssps.dev.azure.com/${organization}/_apis/graph/descriptors/${projectId}?api-version=7.1-preview.1`);
    }

    graphMembershipsList(organization: string, subjectDescriptor: string, direction: 'up' | 'down'): Promise<{ value: GraphMembership[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/memberships/list?view=azure-devops-rest-7.1&tabs=HTTP
        return this.getValue(`https://vssps.dev.azure.com/${organization}/_apis/graph/Memberships/${subjectDescriptor}?direction=${direction}&api-version=7.1-preview.1`);
    }

    userEntitlements(organization: string, descriptor: string): Promise<{ value: any | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/memberentitlementmanagement/user-entitlements/get?view=azure-devops-rest-7.1&tabs=HTTP
        // npm package has no definitions for this...?!?
        const url = `https://vsaex.dev.azure.com/${organization}/_apis/userentitlements/${descriptor}?api-version=7.1-preview.3`;
        return this.get(url);
    }

    teams(organization: string): Promise<{ value: WebApiTeam[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/core/teams/get-all-teams?view=azure-devops-rest-7.1&tabs=HTTP
        return this.getValue(`https://dev.azure.com/${organization}/_apis/teams?api-version=7.1-preview.3`);
    }

    async team(organization: string, projectName:string,  teamName: string): Promise<{ value: WebApiTeam | undefined, error: Error | undefined }> {
        const teams = await this.teams(organization);

        if (teams.error !== undefined) {
            return { value: undefined, error: teams.error };
        }
        else if (teams.value === undefined) {
            return { value: undefined, error: new Error(`teams(${organization}).value === undefined`) };
        }
        else {
            return { value: teams.value.find(p => p.name?.toLowerCase() === teamName.toLowerCase() && p.projectName?.toLowerCase() === projectName.toLowerCase()), error: undefined };
        }
    }

    classificationNodes(parameters: { organization: string, project: string, depth?: number, ids?: number[], errorPolicy?: 'omit' | 'fail' }): Promise<{ value: WorkItemClassificationNode[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/classification-nodes/get-classification-nodes?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://dev.azure.com/${parameters.organization}/${parameters.project}/_apis/wit/classificationnodes?api-version=7.1-preview.2`
                  + (parameters.depth === undefined                                ? '' : `&$depth=${parameters.depth           }`)
                  + (parameters.ids   === undefined || parameters.ids.length === 0 ? '' : `&ids=${parameters.ids.join(',')      }`)
                  + (parameters.errorPolicy === undefined                          ? '' : `&errorPolicy=${parameters.errorPolicy}`);

        return this.getValue(url);
    }

    workIterations(organization: string, project: string, team: string): Promise<{ value: TeamSettingsIteration[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/work/iterations/list?view=azure-devops-rest-7.1&tabs=HTTP
        return this.getValue(`https://dev.azure.com/${organization}/${project}/${team}/_apis/work/teamsettings/iterations?api-version=7.1-preview.1`);
    }

    async workIteration(organization: string, project: string, team: string, iterationPath: string): Promise<{ value: TeamSettingsIteration | undefined, error: Error | undefined }> {
        const collection = await this.workIterations(organization, project, team);

        if (collection.error !== undefined) {
            return { value: undefined, error: collection.error };
        }
        else if (collection.value === undefined) {
            return { value: undefined, error: new Error(`workIterations(${organization}, ${project}, ${team}).value === undefined`) };
        }
        else {
            return { value: collection.value.find(p => p.path?.toLowerCase() === iterationPath.toLowerCase()), error: undefined };
        }
    }

    workBacklogs(organization: string, project: string, team: string): Promise<{ value: BacklogLevelConfiguration[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/work/backlogs/list?view=azure-devops-rest-7.1&tabs=HTTP
        return this.getValue(`https://dev.azure.com/${organization}/${project}/${team}/_apis/work/backlogs?api-version=7.1-preview.1`);
    }

    workTeamSettings(organization: string, project: string, team: string): Promise<{ value: TeamSetting | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/work/teamsettings/get?view=azure-devops-rest-7.1&tabs=HTTP
        return this.get(`https://dev.azure.com/${organization}/${project}/${team}/_apis/work/teamsettings?api-version=7.1-preview.1`);
    }

    accessControlLists(query: {organization: string, securityNamespaceId: string, token?: string, descriptors?: Array<string>, includeExtendedInfo?: boolean, recurse?: boolean}): Promise<{ value: AzureDevOpsAccessControlList[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/security/access-control-lists/query?view=azure-devops-rest-7.1&tabs=HTTP
        const url =  `https://dev.azure.com/${query.organization}/_apis/accesscontrollists/${query.securityNamespaceId}?api-version=7.1-preview.1` +
                    (query.token               === undefined ? '' : `&token=${               query.token                                   }`) +
                    (query.descriptors         === undefined ? '' : `&descriptors=${         query.descriptors.join(',')                   }`) +
                    (query.includeExtendedInfo === undefined ? '' : `&includeExtendedInfo=${(query.includeExtendedInfo ? 'true' : 'false') }`) +
                    (query.recurse             === undefined ? '' : `&recurse=${            (query.recurse             ? 'true' : 'false') }`);

        return this.getValue(url);
    }

    identitiesByDescriptors(organization: string, identityDescriptors: Array<string>): Promise<{ value: Identity[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/ims/identities/read-identities?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/identities?descriptors=${identityDescriptors.join(',')}&api-version=7.1-preview.1`;
        return this.getValue(url);
    }

    gitRepositories(organization: string,project: string): Promise<{ value: GitRepository[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/git/repositories/list?view=azure-devops-rest-7.1&tabs=HTTP
        return this.getValue(`https://dev.azure.com/${organization}/${project}/_apis/git/repositories?api-version=7.1-preview.1`)
    }

    async identityByDescriptor(organization: string, identityDescriptor: string): Promise<{ value: Identity | undefined, error: Error | undefined }> {
        const identity = await this.identitiesByDescriptors(organization, [identityDescriptor]);
        if (identity.error !== undefined) {
            return { value: undefined, error: identity.error };
        }
        else if (identity.value === undefined) {
            return { value: undefined, error: new Error(`identitiesByDescriptors(${organization}, [${identityDescriptor}]).value === undefined`) };
        }
        else if (identity.value.length !== 1) {
            return { value: undefined, error: new Error(`identitiesByDescriptors(${organization}, [${identityDescriptor}]) returns ${identity.value.length} items.`) };
        }
        else {
            return { value: identity.value[0] === null ? undefined : identity.value[0], error: undefined };
        }
    }

    securityNamespaces(organization: string): Promise<{ value: AzureDevOpsSecurityNamespace[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/security/security-namespaces/query?view=azure-devops-rest-7.1&tabs=HTTP#all-security-namespaces
        return this.getValue(`https://dev.azure.com/${organization}/_apis/securitynamespaces?api-version=7.1-preview.1`);
    }

    async securityNamespaceByName(organization: string, name: string): Promise<{ value: AzureDevOpsSecurityNamespace | undefined, error: Error | undefined }> {
        const response = await this.securityNamespaces(organization);

        if (response.error !== undefined) {
            return { value: undefined, error: response.error };
        }
        else if (response.value === undefined) {
            return { value: undefined, error: new Error(`securityNamespaces(${organization}).value === undefined`) };
        }
        else {
            const value = response.value.find(p => p.name?.toLowerCase() === name.toLowerCase());
            return { value, error: undefined };
        }
    }

    async securityNamespace(organization: string, securityNamespaceId: string): Promise<{ value: AzureDevOpsSecurityNamespace | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/security/security-namespaces/query?view=azure-devops-rest-7.1&tabs=HTTP#all-security-namespaces
        const url = `https://dev.azure.com/${organization}/_apis/securitynamespaces/${securityNamespaceId}?api-version=7.1-preview.1`;

        const response = await this.getValue<AzureDevOpsSecurityNamespace[]>(url);

        if (response.error !== undefined) {
            return { value: undefined, error: response.error };
        }
        else if (response.value === undefined) {
            return { value: undefined, error: new Error(`getValue(${url}).value === undefined`) };
        }
        else if (response.value.length !== 1) {
            return { value: undefined, error: new Error(`getValue(${url}).value returns ${response.value.length} items`) };
        }
        else {
            return { value: response.value[0] === null ? undefined : response.value[0], error: undefined };
        }
    }

    userByPrincipalName(organization: string, principalName: string): Promise<{ value: GraphSubject | undefined, error: Error | undefined }> {
        return this.graphSubjectQueryByPrincipalName(organization, ['User'], principalName);
    }

    groupByPrincipalName(organization: string, principalName: string): Promise<{ value: GraphSubject | undefined, error: Error | undefined }> {
        return this.graphSubjectQueryByPrincipalName(organization, ['Group'], principalName);
    }

    async projectByName(organization: string, projectName: string): Promise<{ value: ProjectInfo | undefined, error: Error | undefined }> {
        const projects = await this.projectsList(organization);

        if (projects.error !== undefined) {
            return { value: undefined, error: projects.error };
        }
        else if (projects.value === undefined) {
            return { value: undefined, error: new Error(`Failed to resolve projects for organization[${organization}].`) };
        }
        else {
            const item = projects.value.find(p => p.name?.toLowerCase() === projectName.toLowerCase());

            return { value: item, error: undefined };
        }
    }

    async projectByNameOrId(organization: string, projectNameOrId: string): Promise<{ value: ProjectInfo | undefined, error: Error | undefined }> {
        const projects = await this.projectsList(organization);

        if (projects.error !== undefined) {
            return { value: undefined, error: projects.error };
        }
        else if (projects.value === undefined) {
            return { value: undefined, error: new Error(`Failed to resolve projects for organization[${organization}].`) };
        }
        else {
            const item = projects.value.find(
                p => p.name?.toLowerCase() === projectNameOrId.toLowerCase() 
                  || p.id?.  toLowerCase() === projectNameOrId.toLowerCase()
            );

            return { value: item, error: undefined };
        }
    }

    async graphGroupsListForProjectName(organization: string, projectName: string): Promise<{ value: GraphGroup[] | undefined, error: Error | undefined }> {
        const project = await this.projectByName(organization, projectName);

        if (project.error !== undefined) {
            return { value: undefined, error: project.error };
        }
        else if (project.value === undefined) {
            return { value: undefined, error: new Error(`Failed to resolve project for organization[${organization}] projectName[${projectName}].`) };
        }
        else if (project.value.id === undefined) {
            return { value: undefined, error: new Error(`Failed to resolve project.id for organization[${organization}] projectName[${projectName}].`) };
        }
        else {
            const scopeDescriptor = await this.graphDescriptorForProjectId(organization, project.value.id);

            if (scopeDescriptor.error !== undefined) {
                return { value: undefined, error: scopeDescriptor.error };
            }
            else if (scopeDescriptor.value === undefined) {
                return { value: undefined, error: new Error(`Failed to resolve scopeDescriptor for organization[${organization}] projectName[${projectName}]`) };
            }
            else {
                return await this.graphGroupsListForScopeDescriptor(organization, scopeDescriptor.value);
            }
        }
    }

    async graphGroupsListForProject(organization: string, projectId: string): Promise<{ value: GraphGroup[] | undefined, error: Error | undefined }> {
        const scopeDescriptor = await this.graphDescriptorForProjectId(organization, projectId);

        if (scopeDescriptor.error !== undefined) {
            return { value: undefined, error: scopeDescriptor.error };
        }
        else if (scopeDescriptor.value === undefined) {
            return { value: undefined, error: new Error(`Failed to resolve scopeDescriptor for organization[${organization}] projectId[${projectId}]`) };
        }
        else {
             return await this.graphGroupsListForScopeDescriptor(organization, scopeDescriptor.value);
        }
    }

    async graphSubjectsLookup(organization: string, descriptors: string[]): Promise<{ value: { [id: string] : GraphSubject; } | undefined, error: Error | undefined }> {
        if (descriptors.length === 0) {
            return { value: {}, error: undefined };
        }

        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/subject-lookup/lookup-subjects?view=azure-devops-rest-7.1&tabs=HTTP
        try {
            const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/subjectlookup?api-version=7.1-preview.1`;
            const data = JSON.stringify({ lookupKeys: descriptors.map(descriptor => { return { descriptor } }) });

            const response = await axios.post(url, data, { headers: await this.getHeaders() });

            if (response.status === 200) {
                const items: { [id: string] : GraphSubject; } = response.data.value;

                return { value: items, error: undefined };
            }
            else {
                return { value: undefined, error: new Error(`url[${url}] status[${response.status}] statusText[${response.statusText}]`) };
            }
        }
        catch (error: any) {
            return { value: undefined, error };
        }
    }

    async graphSubjectLookup(organization: string, descriptor: string): Promise<{ value: GraphSubject | undefined, error: Error | undefined }> {
        const graphSubjects = await this.graphSubjectsLookup(organization, [descriptor]);

        if (graphSubjects.error !== undefined) {
            return { value: undefined, error: graphSubjects.error };
        }
        else if (graphSubjects.value === undefined) {
            return { value: undefined, error: new Error(`Failed to resolve graphSubject for organization[${organization}] descriptor[${descriptor}].`) };
        }
        else {
            return { value: graphSubjects.value[descriptor], error: undefined };
        }
    }

    async graphSubjectQueryByPrincipalName(organization: string, subjectKind: ['User'] | ['Group'] | ['User', 'Group'], principalName: string): Promise<{ value: GraphSubject | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/subject-query/query?view=azure-devops-rest-7.1
        try {
            const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/subjectquery?api-version=7.1-preview.1`;
            const data = JSON.stringify({
                query:`${principalName}`,
                subjectKind
             });

            const response = await axios.post(url, data, { headers: await this.getHeaders() });

            if (response.status === 200) {
                return response.data.count === 1 
                     ? { value: response.data.value[0], error: undefined } 
                     : { value: undefined             , error: undefined };
            }
            else {
                return { value: undefined, error: new Error(`url[${url}] status[${response.status}] statusText[${response.statusText}]`) };
            }
        }
        catch (error: any) {
            return { value: undefined, error };
        }
    }

    private accessToken: string | undefined = undefined;

    private async getHeaders() {
        const token = process.env.AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN;
        if (token !== undefined && token.trim().length > 0) {
            const headers = {
                "Authorization": `Basic ${Buffer.from(`:${token}`, 'ascii').toString('base64')}`,
                "Content-Type": "application/json"
            };
            return headers;
        }

        if (this.accessToken === undefined) {
            // https://www.dylanberry.com/2021/02/21/how-to-get-a-pat-personal-access-token-for-azure-devops-from-the-az-cli/
            const command = 'az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken --output tsv'

            const { stdout, stderr } = await CommandRunner.runAndMap(command, stdOut => stdOut?.trim(), stdErr => stdErr?.trim());

            if (stdout !== undefined && stderr?.length === 0) {
                this.accessToken = stdout;
            }
        }

        const headers = {
            'Authorization': `Basic ${Buffer.from(`:${this.accessToken}`, 'ascii').toString('base64')}`,
            //'X-VSS-ForceMsaPassThrough': 'true',
            "Content-Type": "application/json"
        }

        return headers;
    }

    private async get<T>(url: string): Promise<{ value: T | undefined, error: Error | undefined }> {
        try {
            const response = await axios.get(url, { headers: await this.getHeaders() });

            if (response.status === 200) {
                const value: T = response.data;

                return { value, error: undefined };
            }
            else {
                return { value: undefined, error: new Error(`url[${url}] status[${response.status}] statusText[${response.statusText}]`) };
            }
        }
        catch (error: any) {
            return { value: undefined, error };
        }
    }

    private async getValue<T>(url: string): Promise<{ value: T | undefined, error: Error | undefined }> {
        try {
            const response = await axios.get(url, { headers: await this.getHeaders() });

            if (response.status === 200) {
                const value: T = response.data.value;

                return { value, error: undefined };
            }
            else {
                return { value: undefined, error: new Error(`url[${url}] status[${response.status}] statusText[${response.statusText}]`) };
            }
        }
        catch (error: any) {
            return { value: undefined, error };
        }
    }

    private async getItemsWithContinuation<T>(url: string, continuationToken?: string | undefined): Promise<{ value: T[] | undefined, error: Error | undefined }> {
        try {
            const urlWithContinuation = continuationToken === undefined ? url : `${url}&continuationToken=${continuationToken}`;

            const response = await axios.get(urlWithContinuation, { headers: await this.getHeaders() });

            if (response.status === 200) {
                const items: T[] = response.data.value;

                const collection = new Array<T>(...items);

                if (response.headers[this.continuationTokenHeader] !== undefined) {
                    const { value: itemsContinuation, error: errorContinuation } = await this.getItemsWithContinuation<T>(url, response.headers[this.continuationTokenHeader]);
                    if (errorContinuation !== undefined) {
                        return { value: undefined, error: errorContinuation };
                    }
                    else if (itemsContinuation !== undefined) {
                        collection.push(...itemsContinuation);
                    }
                }

                return { value: collection, error: undefined };
            }
            else {
                return { value: undefined, error: new Error(`url[${url}] status[${response.status}] statusText[${response.statusText}]`) };
            }
        }
        catch (error: any) {
            return { value: undefined, error };
        }
    }
}
