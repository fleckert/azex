
import axios from "axios";
import { ProjectInfo                               } from "azure-devops-node-api/interfaces/CoreInterfaces";
import { GraphGroup, GraphMembership, GraphSubject } from "azure-devops-node-api/interfaces/GraphInterfaces";

export class AzureDevOpsHelper {

    private readonly continuationTokenHeader = "x-ms-continuationtoken";

    projectsList(organization: string): Promise<{ value: ProjectInfo[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/core/projects/list?view=azure-devops-rest-7.1&tabs=HTTP
        return this.getItemsWithContinuation(`https://dev.azure.com/${organization}/_apis/projects?api-version=7.1-preview.4`);
    }

    graphGroupsList(organization: string): Promise<{ value: GraphGroup[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/groups/list?view=azure-devops-rest-7.1&tabs=HTTP
        return this.getItemsWithContinuation(`https://vssps.dev.azure.com/${organization}/_apis/graph/groups?api-version=7.1-preview.1`);
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

    async graphSubjectLookup(organization: string, descriptors: string[]): Promise<{ value: { [id: string] : GraphSubject; } | undefined, error: Error | undefined }> {
        if (descriptors.length === 0) {
            return { value: {}, error: undefined };
        }

        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/subject-lookup/lookup-subjects?view=azure-devops-rest-7.1&tabs=HTTP
        try {
            const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/subjectlookup?api-version=7.1-preview.1`;
            const data = JSON.stringify({ lookupKeys: descriptors.map(descriptor => { return { descriptor } }) });

            const response = await axios.post(url, data, { headers: this.getHeaders() });

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

    private getHeaders() {
        const token = process.env.AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN;

        const headers = {
            "Authorization": `Basic ${Buffer.from(`:${token}`, 'ascii').toString('base64')}`,
            "Content-Type": "application/json"
        };

        return headers;
    }

    private async getValue<T>(url: string): Promise<{ value: T | undefined, error: Error | undefined }> {
        try {
            const response = await axios.get(url, { headers: this.getHeaders() });

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

            const response = await axios.get(urlWithContinuation, { headers: this.getHeaders() });

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
