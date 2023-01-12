import axios from "axios";
import { ActiveDirectoryGroup            } from "./models/ActiveDirectoryGroup";
import { ActiveDirectoryPrincipal        } from "./models/ActiveDirectoryPrincipal";
import { ActiveDirectoryServicePrincipal } from "./models/ActiveDirectoryServicePrincipal";
import { ActiveDirectoryUser             } from "./models/ActiveDirectoryUser";
import { TokenCredential                 } from "@azure/identity";

interface BatchResponse<T> {
    id    : number
    status: number
    body  : { '@odata.context': string} & T
}

interface BatchResponseValue<T> {
    id    : number
    status: number
    body  : { '@odata.context': string } & { value: Array<T> }
}

interface BatchGetRequest {
    url   : string
    method: string
    id    : number
}

export class ActiveDirectoryHelper {

    private readonly urlBlank = '%20';
    private readonly urlHash  = '%23';

    private readonly selectUser             = '$select=id,displayName,userPrincipalName';
    private readonly selectServicePrincipal = '$select=id,displayName,appId,servicePrincipalType';
    private readonly selectGroup            = '$select=id,displayName';


    constructor(
        readonly credential: TokenCredential
    ) { }

    private async getToken(): Promise<string> {
        const accessToken = await this.credential.getToken("https://graph.microsoft.com/.default");

        if (accessToken === null) { throw "Failed to retrieve accessToken for https://graph.microsoft.com/.default."; }

        return accessToken.token;
    }

    async getUsersById            (ids: string[]): Promise<{ items: Array<ActiveDirectoryUser            >, failedRequests: Array<string> }> { return this.getUsersByIdBatched            (ids); }
    async getGroupsById           (ids: string[]): Promise<{ items: Array<ActiveDirectoryGroup           >, failedRequests: Array<string> }> { return this.getGroupsByIdBatched           (ids); }
    async getServicePrincipalsById(ids: string[]): Promise<{ items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string> }> { return this.getServicePrincipalsByIdBatched(ids); }

    async getUsersByUserPrincipalName      (userPrincipalNames   : string[]): Promise<{ items: Array<ActiveDirectoryUser            >, failedRequests: Array<string> }> { return this.getUsersByUserPrincipalNameBatched      (userPrincipalNames   ); }
    async getGroupsByDisplayName           (groupNames           : string[]): Promise<{ items: Array<ActiveDirectoryGroup           >, failedRequests: Array<string> }> { return this.getGroupsByDisplayNameBatched           (groupNames           ); }
    async getServicePrincipalsByDisplayName(servicePrincipalNames: string[]): Promise<{ items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string> }> { return this.getServicePrincipalsByDisplayNameBatched(servicePrincipalNames); }

    async getPrincipalsbyId(ids: string[]): Promise<{ items: Array<ActiveDirectoryPrincipal>, failedRequests: Array<string>}> {
        const usersPromise             = this.getUsersById            (ids);
        const groupsPromise            = this.getGroupsById           (ids);
        const serviceprincipalsPromise = this.getServicePrincipalsById(ids);

        const users             = await usersPromise;
        const groups            = await groupsPromise;
        const serviceprincipals = await serviceprincipalsPromise;

        const principals = new Array<ActiveDirectoryPrincipal>();
        principals.push(...users.items);
        principals.push(...groups.items);
        principals.push(...serviceprincipals.items);

        const failedRequests = new Array<string>();

        for (const id of ids) {
            if (principals.find(p => p.id.toLocaleLowerCase() === id.toLowerCase()) !== undefined) {
                failedRequests.push(id);
            }
        }

        return { items: principals, failedRequests };
    }

    private async getServicePrincipalsByIdBatched(ids: string[]): Promise<{items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string>}>{
        return this.getBatched<ActiveDirectoryServicePrincipal>(
            ids.map(p => `/serviceprincipals/${p}?${this.selectServicePrincipal}`),
            p => {
                return {
                    type                : 'ServicePrincipal',
                    id                  : p.body.id,
                    displayName         : p.body.displayName,
                    appId               : p.body.appId,
                    servicePrincipalType: p.body.servicePrincipalType
                }
            });
    }

    private async getServicePrincipalsByDisplayNameBatched(displayNames: string[]): Promise<{items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string>}>{
        return this.getBatchedValue<ActiveDirectoryServicePrincipal>(
            displayNames.map(p => `/serviceprincipals?$filter=displayName${this.urlBlank}eq${this.urlBlank}'${p.replaceAll("#", this.urlHash)}'&${this.selectServicePrincipal}`),
            p => {
                return {
                    type                : 'ServicePrincipal',
                    id                  : p.body.value[0].id,
                    displayName         : p.body.value[0].displayName,
                    appId               : p.body.value[0].appId,
                    servicePrincipalType: p.body.value[0].servicePrincipalType
                }
            });
    }

    private async getUsersByIdBatched(ids: string[]): Promise<{items: Array<ActiveDirectoryUser>, failedRequests: Array<string>}> 
    {
        return this.getBatched<ActiveDirectoryUser>(
            ids.map(p => `/users/${p}?${this.selectUser}`),
            p => {
                return {
                    type             : 'User',
                    id               : p.body.id,
                    displayName      : p.body.displayName,
                    userPrincipalName: p.body.userPrincipalName
                }
            });
    }

    private async getUsersByUserPrincipalNameBatched(userPrincipalNames: string[]): Promise<{items: Array<ActiveDirectoryUser>, failedRequests: Array<string>}> 
    {
        return this.getBatchedValue<ActiveDirectoryUser>(
            userPrincipalNames.map(p => `/users?$filter=userPrincipalName${this.urlBlank}eq${this.urlBlank}'${p.replaceAll("#", this.urlHash)}'&${this.selectUser}`),
            p => {
                return {
                    type             : 'User',
                    id               : p.body.value[0].id,
                    displayName      : p.body.value[0].displayName,
                    userPrincipalName: p.body.value[0].userPrincipalName
                }
            });
    }

    private async getGroupsByDisplayNameBatched(displayNames: string[]): Promise<{ items: Array<ActiveDirectoryGroup>, failedRequests: Array<string> }> {
        return this.getBatchedValue<ActiveDirectoryGroup>(
            displayNames.map(p => `/groups?$filter=displayName${this.urlBlank}eq${this.urlBlank}'${p.replaceAll("#", this.urlHash)}'&${this.selectGroup}`),
            p => {
                return {
                    type       : 'Group',
                    id         : p.body.value[0].id,
                    displayName: p.body.value[0].displayName
                }
            });
    }

    private async getGroupsByIdBatched(ids: string[]): Promise<{ items: Array<ActiveDirectoryGroup>, failedRequests: Array<string> }> {
        return this.getBatched<ActiveDirectoryGroup>(
            ids.map(p => `/groups/${p}?${this.selectGroup}`),
            p => {
                return {
                    type       : 'Group',
                    id         : p.body.id,
                    displayName: p.body.displayName
                }
            });
    }

    private async getBatched<T>(urls: string[], mapper: (b: BatchResponse<T>) => T): Promise<{ items: Array<T>, failedRequests: Array<string> }> {

        const requestsAll = this.getBatchGetRequests(urls);

        const token = await this.getToken();

        const headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }

        const collectionOk     = new Array<T     >();
        const collectionFailed = new Array<string>();

        for (const requests of requestsAll) {
            try {
                const data = JSON.stringify({ requests: requests });
            
                const response = await axios.post("https://graph.microsoft.com/v1.0/\$batch", data, { headers });

                if (response.status === 200) {
                    const itemsInResponse = response.data.responses as BatchResponse<T>[];

                    const itemsOk = itemsInResponse.filter(p => p.status === 200).map(mapper);

                    collectionOk.push(...itemsOk);

                    const failedRequestIds = itemsInResponse.filter(p => p.status !== 200).map(p => p.id);

                    for (const failedRequestId of failedRequestIds) {
                        const failedRequestUrl = requests.filter(p => `${p.id}` === `${failedRequestId}`).map(p => p.url)[0];
                        collectionFailed.push(failedRequestUrl);
                    }
                }
                else {
                    collectionFailed.push(...requests.map(p => p.url));
                }
            }
            catch {
                collectionFailed.push(...requests.map(p => p.url));
            }
        }
        
        return { items: collectionOk, failedRequests: collectionFailed };
    }

    private async getBatchedValue<T>(urls: string[], mapper: (b: BatchResponseValue<T>) => T): Promise<{ items: Array<T>, failedRequests: Array<string> }> {

        const requestsAll = this.getBatchGetRequests(urls);

        const token = await this.getToken();

        const headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }

        const collectionOk     = new Array<T     >();
        const collectionFailed = new Array<string>();

        for (const requests of requestsAll) {
            try {
                const data = JSON.stringify({ requests: requests });
            
                const response = await axios.post("https://graph.microsoft.com/v1.0/\$batch", data, { headers });

                if (response.status === 200) {
                    const itemsInResponse = response.data.responses as BatchResponseValue<T>[];

                    const itemsOk = itemsInResponse.filter(p => p.status === 200).map(mapper);

                    collectionOk.push(...itemsOk);

                    const failedRequestIds = itemsInResponse.filter(p => p.status !== 200).map(p => p.id);

                    for (const failedRequestId of failedRequestIds) {
                        const failedRequestUrl = requests.filter(p => `${p.id}` === `${failedRequestId}`).map(p => p.url)[0];
                        collectionFailed.push(failedRequestUrl);
                    }
                }
                else {
                    collectionFailed.push(...requests.map(p => p.url));
                }
            }
            catch {
                collectionFailed.push(...requests.map(p => p.url));
            }
        }
        
        return { items: collectionOk, failedRequests: collectionFailed };
    }

    private getBatchGetRequests(urls: string[]): Array<Array<BatchGetRequest>> {
        const requestsAll = new Array<Array<BatchGetRequest>>();
        requestsAll.push(new Array<BatchGetRequest>());

        for (let index = 0; index < urls.length; index++) {
            if (requestsAll[requestsAll.length - 1].length == 20) {
                requestsAll.push(new Array<BatchGetRequest>());
            }

            requestsAll[requestsAll.length - 1].push({
                url   : urls[index],
                method: "GET",
                id    : index
            });
        }

        return requestsAll;
    }
}