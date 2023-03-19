import { CoreApi                           } from "azure-devops-node-api/CoreApi";
import { getPersonalAccessTokenHandler     } from "azure-devops-node-api";
import { GitApi                            } from "azure-devops-node-api/GitApi";
import { IRequestHandler                   } from "azure-devops-node-api/interfaces/common/VsoBaseInterfaces";
import { TeamProject, TeamProjectReference } from "azure-devops-node-api/interfaces/CoreInterfaces";
import { WorkItemTrackingProcessApi        } from "azure-devops-node-api/WorkItemTrackingProcessApi";
import { ProcessWorkItemType               } from "azure-devops-node-api/interfaces/WorkItemTrackingProcessInterfaces";
import { WorkApi                           } from "azure-devops-node-api/WorkApi";
import { TeamSetting                       } from "azure-devops-node-api/interfaces/WorkInterfaces";
import { AzureDevOpsPat                    } from "./AzureDevOpsPat";
import { WikiApi                           } from "azure-devops-node-api/WikiApi";
import { Helper } from "./Helper";

export class AzureDevOpsWrapper {
    readonly requestHandlers:  IRequestHandler[];
    private constructor(
        readonly baseUrl: string,
        readonly token  : string
    ) {
        this.requestHandlers = [getPersonalAccessTokenHandler(token)];
     }

    static async instance(baseUrl: string, tenant? : string): Promise<AzureDevOpsWrapper> {
        const token = await AzureDevOpsPat.getPersonalAccessToken(tenant);
        return new AzureDevOpsWrapper(baseUrl, token);
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
}
