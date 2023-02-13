
import { AzureDevOpsHelper             } from "./AzureDevOpsHelper";
import { CoreApi                       } from "azure-devops-node-api/CoreApi";
import { getPersonalAccessTokenHandler } from "azure-devops-node-api";
import { GitApi                        } from "azure-devops-node-api/GitApi";
import { IRequestHandler               } from "azure-devops-node-api/interfaces/common/VsoBaseInterfaces";
import { TeamProject                   } from "azure-devops-node-api/interfaces/CoreInterfaces";

export class AzureDevOpsWrapper {
    readonly  requestHandlers:  IRequestHandler[];
    constructor(
        readonly baseUrl: string,
        readonly token:  string,
    ) {
        this.requestHandlers = [getPersonalAccessTokenHandler(token)];
     }

    gitRepositories(project: string) { return new GitApi(this.baseUrl, this.requestHandlers).getRepositories(project); }
    
    project(project: string) { return new CoreApi(this.baseUrl, this.requestHandlers).getProject(project, true); }

    async projects(organization: string): Promise<TeamProject[]> {
        const azureDevOpsHelper = new AzureDevOpsHelper();
        const projects = await azureDevOpsHelper.projectsList(organization);
        if (projects.error !== undefined) { throw new Error(`Failed to resolve projects ${JSON.stringify(organization)} [${projects.error}].`); }
        if (projects.value === undefined) { throw new Error(`Failed to resolve projects ${JSON.stringify(organization)}.`); }

        const batchSize = 10;
        const collection = new Array<TeamProject>;
        const batchesOfProjectsIds = this.getBatches(projects.value!.filter(p => p.id !== undefined).map(p => p.id!), batchSize);
        for (const batchOfProjectIds of batchesOfProjectsIds) {
            const responses = await Promise.all(batchOfProjectIds.map(projectId => this.project(projectId)));
            collection.push(...responses);
        }

        return collection;
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
}
