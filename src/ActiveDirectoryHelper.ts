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

interface BatchGetRequest {
    url   : string
    method: string
    id    : number
}

export class ActiveDirectoryHelper {
    constructor(
        readonly credential: TokenCredential
    ) { }

    private async getToken(): Promise<string> {
        const token = await this.credential.getToken("https://graph.microsoft.com");

        if (token === null) { throw "token === null" }

        return token.token;
    }

    async getUsersById            (ids: string[]): Promise<{ items: Array<ActiveDirectoryUser            >, failedRequests: Array<string> }> { return this.getUsersByIdBatched            (ids); }
    async getGroupsById           (ids: string[]): Promise<{ items: Array<ActiveDirectoryGroup           >, failedRequests: Array<string> }> { return this.getGroupsByIdBatched           (ids); }
    async getServicePrincipalsById(ids: string[]): Promise<{ items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string> }> { return this.getServicePrincipalsByIdBatched(ids); }

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
            if (principals.filter(p => p.id === id)[0] === undefined) {
                failedRequests.push(id);
            }
        }

        return { items: principals, failedRequests };
    }

    private async getServicePrincipalsByIdBatched(ids: string[]): Promise<{items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string>}>{
        return this.getByIdBatched<ActiveDirectoryServicePrincipal>(
            ids.map(p => `/serviceprincipals/${p}?$select=id,displayName,appId,servicePrincipalType`),
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

    private async getUsersByIdBatched(ids: string[]): Promise<{items: Array<ActiveDirectoryUser>, failedRequests: Array<string>}> 
    {
        return this.getByIdBatched<ActiveDirectoryUser>(
            ids.map(p => `/users/${p}?$select=id,displayName,userPrincipalName`),
            p => {
                return {
                    type             : 'User',
                    id               : p.body.id,
                    displayName      : p.body.displayName,
                    userPrincipalName: p.body.userPrincipalName
                }
            });
    }

    private async getGroupsByIdBatched(ids: string[]): Promise<{ items: Array<ActiveDirectoryGroup>, failedRequests: Array<string> }> {
        return this.getByIdBatched<ActiveDirectoryGroup>(
            ids.map(p => `/groups/${p}?$select=id,displayName`),
            p => {
                return {
                    type       : 'Group',
                    id         : p.body.id,
                    displayName: p.body.displayName
                }
            });
    }

    private async getByIdBatched<T>(ids: string[], mapper: (b: BatchResponse<T>) => T): Promise<{ items: Array<T>, failedRequests: Array<string> }> {

        const requestsAll = this.getBatchGetRequests(ids);

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