import { CoreApi                           } from "azure-devops-node-api/CoreApi";
import { getPersonalAccessTokenHandler     } from "azure-devops-node-api";
import { GitApi                            } from "azure-devops-node-api/GitApi";
import { IRequestHandler                   } from "azure-devops-node-api/interfaces/common/VsoBaseInterfaces";
import { TeamProject, TeamProjectReference } from "azure-devops-node-api/interfaces/CoreInterfaces";
import { CommandRunner                     } from "./CommandRunner";
import { WorkItemTrackingProcessApi } from "azure-devops-node-api/WorkItemTrackingProcessApi";
import { ProcessWorkItemType, ProcessWorkItemTypeField } from "azure-devops-node-api/interfaces/WorkItemTrackingProcessInterfaces";
import { WorkApi } from "azure-devops-node-api/WorkApi";
import { TeamSetting } from "azure-devops-node-api/interfaces/WorkInterfaces";
import { AzureDevOpsPat } from "./AzureDevOpsPat";
import { WikiApi } from "azure-devops-node-api/WikiApi";

export class AzureDevOpsWrapper {
    readonly requestHandlers:  IRequestHandler[];
    private constructor(
        readonly baseUrl: string,
        readonly token  : string
    ) {
        this.requestHandlers = [getPersonalAccessTokenHandler(token)];
     }

    static async instance(baseUrl: string, tenantId? : string): Promise<AzureDevOpsWrapper> {
        const token = await AzureDevOpsPat.getPersonalAccessToken(tenantId);
        return new AzureDevOpsWrapper(baseUrl, token);
    }

    gitRepositories(project: string) { return new GitApi(this.baseUrl, this.requestHandlers).getRepositories(project); }
    gitRepository(project: string, repository: string) { return new GitApi(this.baseUrl, this.requestHandlers).getRepository(repository, project); }
    
    project(projectId: string) { return new CoreApi(this.baseUrl, this.requestHandlers).getProject(projectId, true); }

    async projects(): Promise<TeamProject[]> {
        const projects = await this.projectsInternal();
        const batchSize = 10;
        const collection = new Array<TeamProject>;
        const batchesOfProjectsIds = this.getBatches(projects.filter(p => p.id !== undefined).map(p => p.id!), batchSize);
        for (const batchOfProjectIds of batchesOfProjectsIds) {
            const responses = await Promise.all(batchOfProjectIds.map(projectId => this.project(projectId)));
            collection.push(...responses);
        }

        return collection;
    }

    processes() { return new CoreApi(this.baseUrl, this.requestHandlers).getProcesses(); }
    process(processId: string) { return new CoreApi(this.baseUrl, this.requestHandlers).getProcessById(processId); }

    async workItemProcesses() {
        const workItemTrackingProcessApi = new WorkItemTrackingProcessApi(this.baseUrl, this.requestHandlers);
        const processInfos = await workItemTrackingProcessApi.getListOfProcesses();

        const items = new Array<{
            processInfo: string,
            processWorkItemTypes: {
                processWorkItemType: string,
                processWorkItemTypeFields: string[]
            }[]
        }>();

        for (const processInfo of processInfos.filter(p => p.typeId !== undefined)) {
            const processWorkItemTypes = await workItemTrackingProcessApi.getProcessWorkItemTypes(processInfo.typeId!);
            processWorkItemTypes.sort((a: ProcessWorkItemType, b: ProcessWorkItemType) => (a.name ?? '').toLowerCase().localeCompare((b.name ?? '').toLowerCase()));

            items.push({
                processInfo: processInfo.name ?? processInfo.typeId!,
                processWorkItemTypes: []
            });

            for (const processWorkItemType of processWorkItemTypes.filter(p => p.referenceName !== undefined)) {
                const processWorkItemTypeFields = await workItemTrackingProcessApi.getAllWorkItemTypeFields(processInfo.typeId!, processWorkItemType.referenceName!);

                const processWorkItemTypeFieldNames = processWorkItemTypeFields.map(p => p.name ?? p.referenceName ?? '');
                processWorkItemTypeFieldNames.sort();

                // const processWorkItemTypeRules = await workItemTrackingProcessApi.getProcessWorkItemTypeRules(processInfo.typeId!, processWorkItemType.referenceName!)
                // const processWorkItemTypeRulesNames = processWorkItemTypeRules.map(p => p.name ?? p.id ?? '');
                // processWorkItemTypeRulesNames.sort();

                items[items.length - 1].processWorkItemTypes.push({
                    processWorkItemType: processWorkItemType.name ?? processWorkItemType.referenceName!,
                    processWorkItemTypeFields: processWorkItemTypeFieldNames
                })
            }
        }

        return items;
    }

    workTeamSettings(projectId: string, teamId: string): Promise<TeamSetting> {
        return new WorkApi(this.baseUrl, this.requestHandlers).getTeamSettings({ projectId, teamId });
    }

    async wikiPaths(project?: string) {
        const client = new WikiApi(this.baseUrl, this.requestHandlers);
        const wikis = await client.getAllWikis(project);

        for (const wikiId of wikis.filter(p => p.id !== undefined).map(p => p.id!)) {
            const wiki = await client.getWiki(wikiId!);
            console.log(wiki);
        }

        throw new Error('not implemented');
        return wikis;
    }

    private async projectsInternal(): Promise<Array<TeamProjectReference>> {

        const teamProjectReferences = new Array<TeamProjectReference>();

        const client = new CoreApi(this.baseUrl, this.requestHandlers);

        while (true) {
            const stateFilter           : any     | undefined = undefined;
            const top                   : number  | undefined = 2; 
            const skip                  : number  | undefined = undefined; 
            const continuationToken     : string  | undefined = teamProjectReferences.length.toString(); 
            const getDefaultTeamImageUrl: boolean | undefined = undefined;

            const collection = await client.getProjects(stateFilter, top, skip, continuationToken, getDefaultTeamImageUrl);

            for (const item of collection) {
                if (teamProjectReferences.find(p=>p.id === item.id) === undefined) {
                    teamProjectReferences.push(item);
                }
            }

            if (collection.length <= 1) {
                break;
            }
        }

        return teamProjectReferences;
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
