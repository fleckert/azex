
import axios from "axios";
import { ProjectInfo                               } from "azure-devops-node-api/interfaces/CoreInterfaces";
import { GraphGroup, GraphMembership, GraphSubject } from "azure-devops-node-api/interfaces/GraphInterfaces";

export class AzureDevOpsHelper {

    private readonly continuationTokenHeader = "x-ms-continuationtoken";

    private getHeaders() {
        const token = process.env.AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN;

        const headers = {
            "Authorization": `Basic ${Buffer.from(`:${token}`, 'ascii').toString('base64')}`,
            "Content-Type": "application/json"
        };

        return headers;
    }

    async projectsList(organization: string, continuationToken?: string | undefined): Promise<{ items: ProjectInfo[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/core/projects/list?view=azure-devops-rest-7.1&tabs=HTTP
        try {
            const url = continuationToken === undefined
                      ? `https://dev.azure.com/${organization}/_apis/projects?api-version=7.1-preview.4`
                      : `https://dev.azure.com/${organization}/_apis/projects?continuationToken=${continuationToken}&api-version=7.1-preview.4`;
            
            const response = await axios.get(url, { headers: this.getHeaders() });
            
            if (response.status === 200) {
                const items: ProjectInfo[] = response.data.value;
                
                const collection = new Array<ProjectInfo>(...items);

                if (response.headers[this.continuationTokenHeader] !== undefined) {
                    const { items: itemsContinuation, error: errorContinuation } = await this.projectsList(organization, response.headers[this.continuationTokenHeader]);
                    if (errorContinuation !== undefined) {
                        return { items: undefined, error: errorContinuation };
                    }
                    else if (itemsContinuation === undefined) {
                        return { items: undefined, error: new Error("itemsContinuation === undefined") };
                    }
                    else {
                        collection.push(...itemsContinuation);
                    }
                }

                return { items: collection, error: undefined };
            }
            else {
                return { items: undefined, error: new Error(`${response.status} ${response.statusText}`) };
            }
        }
        catch (error: any) {
            return { items: undefined, error };
        }
    }

    async projectByName(organization: string, projectName: string): Promise<{ projectInfo: ProjectInfo | undefined, error: Error | undefined }> {
        const projects = await this.projectsList(organization);

        if (projects.error !== undefined) {
            return { projectInfo: undefined, error: projects.error };
        }
        else if (projects.items === undefined) {
            return { projectInfo: undefined, error: new Error('Failed to resolve projects.') };
        }
        else {

            const item = projects.items.find(p => p.name?.toLowerCase() === projectName.toLowerCase());

            return { projectInfo: item, error: undefined };
        }
    }

    async getProjectScopeDescriptor(organization: string, projectId: string): Promise<{ value: string | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/descriptors/get?view=azure-devops-rest-7.1&tabs=HTTP
        try {
            const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/descriptors/${projectId}?api-version=7.1-preview.1`;

            const response = await axios.get(url, { headers: this.getHeaders() });

            if (response.status === 200) {
                const value: string | undefined = response.data.value;

                return { value, error: undefined };
            }
            else {
                return { value: undefined, error: new Error(`${response.status} ${response.statusText}`) };
            }
        }
        catch (error: any) {
            return { value: undefined, error };
        }
    }

    async graphGroupsList(organization: string, continuationToken?: string | undefined): Promise<{ items: GraphGroup[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/groups/list?view=azure-devops-rest-7.1&tabs=HTTP
        try {
            const url = continuationToken === undefined
                      ? `https://vssps.dev.azure.com/${organization}/_apis/graph/groups?api-version=7.1-preview.1`
                      : `https://vssps.dev.azure.com/${organization}/_apis/graph/groups?continuationToken=${continuationToken}&api-version=7.1-preview.1`;

            const response = await axios.get(url, { headers: this.getHeaders() });

            if (response.status === 200) {
                const items: GraphGroup[] = response.data.value;

                const collection = new Array<GraphGroup>(...items);

                if (response.headers[this.continuationTokenHeader] !== undefined) {
                    const { items: itemsContinuation, error: errorContinuation } = await this.graphGroupsList(organization, response.headers[this.continuationTokenHeader]);
                    if (errorContinuation !== undefined) {
                        return { items: undefined, error: errorContinuation };
                    }
                    else if (itemsContinuation === undefined) {
                        return { items: undefined, error: new Error("itemsContinuation === undefined") };
                    }
                    else {
                        collection.push(...itemsContinuation);
                    }
                }

                return { items: collection, error: undefined };
            }
            else {
                return { items: undefined, error: new Error(`${response.status} ${response.statusText}`) };
            }
        }
        catch (error: any) {
            return { items: undefined, error };
        }
    }

    async graphGroupsListForProject(organization: string, projectId: string): Promise<{ items: GraphGroup[] | undefined, error: Error | undefined }> {
        const scopeDescriptor = await this.getProjectScopeDescriptor(organization, projectId);

        if (scopeDescriptor.error !== undefined) {
            return { items: undefined, error: scopeDescriptor.error };
        }
        else if (scopeDescriptor.value === undefined) {
            return { items: undefined, error: new Error("scopeDescriptor === undefined") };
        }
        else {
             return await this.graphGroupsListForScopeDescriptor(organization, scopeDescriptor.value);
        }
    }

    async graphGroupsListForScopeDescriptor(organization: string, scopeDescriptor: string, continuationToken?: string | undefined): Promise<{ items: GraphGroup[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/groups/list?view=azure-devops-rest-7.1&tabs=HTTP
        try {
            const url = continuationToken === undefined
                      ? `https://vssps.dev.azure.com/${organization}/_apis/graph/groups?scopeDescriptor=${scopeDescriptor}&api-version=7.1-preview.1`
                      : `https://vssps.dev.azure.com/${organization}/_apis/graph/groups?scopeDescriptor=${scopeDescriptor}&continuationToken=${continuationToken}&api-version=7.1-preview.1`;

            const response = await axios.get(url, { headers: this.getHeaders() });

            if (response.status === 200) {
                const items: GraphGroup[] = response.data.value;

                const collection = new Array<GraphGroup>(...items);

                if (response.headers[this.continuationTokenHeader] !== undefined) {
                    const { items: itemsContinuation, error: errorContinuation } = await this.graphGroupsListForScopeDescriptor(organization, scopeDescriptor, response.headers[this.continuationTokenHeader]);
                    if (errorContinuation !== undefined) {
                        return { items: undefined, error: errorContinuation };
                    }
                    else if (itemsContinuation === undefined) {
                        return { items: undefined, error: new Error("itemsContinuation === undefined") };
                    }
                    else {
                        collection.push(...itemsContinuation);
                    }
                }

                return { items: collection, error: undefined };
            }
            else {
                return { items: undefined, error: new Error(`${response.status} ${response.statusText}`) };
            }
        }
        catch (error: any) {
            return { items: undefined, error };
        } 
    }


    async graphMembershipsList(organization: string, subjectDescriptor: string, direction: 'up' |'down'): Promise<{ items: GraphMembership[] | undefined, error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/memberships/list?view=azure-devops-rest-7.1&tabs=HTTP
        try {
            const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/Memberships/${subjectDescriptor}?direction=${direction}&api-version=7.1-preview.1`;

            const response = await axios.get(url, { headers: this.getHeaders() });

            if (response.status === 200) {
                const items: GraphMembership[] = response.data.value;

                return { items, error: undefined };
            }
            else {
                return { items: undefined, error: new Error(`${response.status} ${response.statusText}`) };
            }
        }
        catch (error: any) {
            return { items: undefined, error };
        }
    }

    async graphSubjectLookup(organization: string, descriptors: string[]): Promise<{ items: { [id: string] : GraphSubject; } | undefined, error: Error | undefined }> {
        if (descriptors.length === 0) {
            return { items: {}, error: undefined };
        }

        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/subject-lookup/lookup-subjects?view=azure-devops-rest-7.1&tabs=HTTP
        try {
            const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/subjectlookup?api-version=7.1-preview.1`;
            const data = JSON.stringify({ lookupKeys: descriptors.map(descriptor => { return { descriptor } }) });

            const response = await axios.post(url, data, { headers: this.getHeaders() });

            if (response.status === 200) {
                const items: { [id: string] : GraphSubject; } = response.data.value;

                return { items, error: undefined };
            }
            else {
                return { items: undefined, error: new Error(`${response.status} ${response.statusText}`) };
            }
        }
        catch (error: any) {
            return { items: undefined, error };
        }
    }
}
