
import axios from "axios";
import { ProjectInfo                               } from "azure-devops-node-api/interfaces/CoreInterfaces";
import { GraphGroup, GraphMembership, GraphSubject } from "azure-devops-node-api/interfaces/GraphInterfaces";

export class AzureDevOpsHelper {

    private getHeaders() {
        const token = process.env.AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN;

        const headers = {
            "Authorization": `Basic ${Buffer.from(`:${token}`, 'ascii').toString('base64')}`,
            "Content-Type": "application/json"
        };

        return headers;
    }

    async projectsList(organization: string): Promise<{ items: ProjectInfo[] | undefined, error: Error | undefined }> {
        const headers = this.getHeaders();
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/core/projects/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://dev.azure.com/${organization}/_apis/projects?api-version=7.1-preview.4`;

        try {

            const response = await axios.get(url, { headers });

            if (response.status === 200) {
                const items: ProjectInfo[] = response.data.value;

                // todo handling continuationToken

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
        const headers = this.getHeaders();
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/descriptors/get?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/descriptors/${projectId}?api-version=7.1-preview.1`;

        try {
            const response = await axios.get(url, { headers });

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

    async graphGroupsList(organization: string): Promise<{ items: GraphGroup[] | undefined, error: Error | undefined }> {
        const headers = this.getHeaders();
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/groups/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/groups?api-version=7.1-preview.1`;

        try {
            const response = await axios.get(url, { headers });

            if (response.status === 200) {
                const items: GraphGroup[] = response.data.value;

                // todo handling continuationToken

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

    async graphGroupsListForProject(organization: string, projectId: string): Promise<{ items: GraphGroup[] | undefined, error: Error | undefined }> {
        const scopeDescriptor = await this.getProjectScopeDescriptor(organization, projectId);

        if (scopeDescriptor.error !== undefined) {
            return { items: undefined, error: scopeDescriptor.error };
        }
        else if (scopeDescriptor.value === undefined) {
            return { items: undefined, error: new Error("scopeDescriptor === undefined") };
        }
        else {
            const headers = this.getHeaders();

            // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/groups/list?view=azure-devops-rest-7.1&tabs=HTTP
            const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/groups?scopeDescriptor=${scopeDescriptor.value}&api-version=7.1-preview.1`;

            try {

                const response = await axios.get(url, { headers });

                if (response.status === 200) {
                    const items: GraphGroup[] = response.data.value;

                    // todo handling continuationToken

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

    async graphMembershipsList(organization: string, subjectDescriptor: string, direction: 'up' |'down'): Promise<{ items: GraphMembership[] | undefined, error: Error | undefined }> {

        const headers = this.getHeaders();
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/memberships/list?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/Memberships/${subjectDescriptor}?direction=${direction}&api-version=7.1-preview.1`;

        try {
            const response = await axios.get(url, { headers });

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

        const headers = this.getHeaders();
        // https://learn.microsoft.com/en-us/rest/api/azure/devops/graph/subject-lookup/lookup-subjects?view=azure-devops-rest-7.1&tabs=HTTP
        const url = `https://vssps.dev.azure.com/${organization}/_apis/graph/subjectlookup?api-version=7.1-preview.1`;
        const data = JSON.stringify({ lookupKeys: descriptors.map(descriptor => { return { descriptor } }) });

        try {
            const response = await axios.post(url, data, { headers });

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
