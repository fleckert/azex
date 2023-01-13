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

    private readonly microsoftGraphV1Endpoint = 'https://graph.microsoft.com/v1.0';

    private readonly urlBlank = '%20';
    private readonly urlHash  = '%23';

    private readonly selectUser             = '$select=id,displayName,userPrincipalName';
    private readonly selectServicePrincipal = '$select=id,displayName,appId,servicePrincipalType';
    private readonly selectGroup            = '$select=id,displayName';


    constructor(
        readonly credential: TokenCredential
    ) { }

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
            if (principals.find(p => p.id.toLocaleLowerCase() === id.toLowerCase()) === undefined) {
                failedRequests.push(`${this.microsoftGraphV1Endpoint} - Failed to resolve id '${id}'.`);
            }
        }

        return { items: principals, failedRequests };
    }

    private async getServicePrincipalsByIdBatched(ids: string[]): Promise<{items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string>}>{
        return this.getBatched<ActiveDirectoryServicePrincipal>(
            ids.map(p => `/serviceprincipals/${p}?${this.selectServicePrincipal}`),
            p => { p.type = 'ServicePrincipal'; return p; }
        );
    }

    private async getServicePrincipalsByDisplayNameBatched(displayNames: string[]): Promise<{items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string>}>{
        const getUrl = (displayName : string) => `/serviceprincipals?$filter=displayName${this.urlBlank}eq${this.urlBlank}'${displayName.replaceAll("#", this.urlHash)}'&${this.selectServicePrincipal}`
        
        const result = await this.getBatchedValue<ActiveDirectoryServicePrincipal>(
            displayNames.map(getUrl),
            p => { p.type = 'ServicePrincipal'; return p; }
        );

        // servicePrincipalNames may not be unique, check for duplicates
        const resultChecked = {items: new Array<ActiveDirectoryServicePrincipal>(), failedRequests: new Array<string>()};
        resultChecked.failedRequests.push(...result.failedRequests);

        const servicePrincipalDisplayNames = new Set(result.items.map(p => p.displayName));

        for (const displayName of servicePrincipalDisplayNames) {
            const itemsForDisplayName = result.items.filter(p => p.displayName === displayName);

            if(itemsForDisplayName.length === 1){
                resultChecked.items.push(itemsForDisplayName[0]);
            }
            else{
                resultChecked.failedRequests.push(`${this.microsoftGraphV1Endpoint}${getUrl(displayName)} - displayName '${displayName}' is not unique`);
            }
        }

        return resultChecked;
    }

    private async getUsersByIdBatched(ids: string[]): Promise<{items: Array<ActiveDirectoryUser>, failedRequests: Array<string>}> 
    {
        return this.getBatched<ActiveDirectoryUser>(
            ids.map(p => `/users/${p}?${this.selectUser}`),
            p => { p.type = 'User'; return p; }
        );
    }

    private async getUsersByUserPrincipalNameBatched(userPrincipalNames: string[]): Promise<{items: Array<ActiveDirectoryUser>, failedRequests: Array<string>}> 
    {
        return this.getBatchedValue<ActiveDirectoryUser>(
            userPrincipalNames.map(p => `/users?$filter=userPrincipalName${this.urlBlank}eq${this.urlBlank}'${p.replaceAll("#", this.urlHash)}'&${this.selectUser}`),
            p => { p.type = 'User'; return p; }
        );
    }

    private async getGroupsByDisplayNameBatched(displayNames: string[]): Promise<{ items: Array<ActiveDirectoryGroup>, failedRequests: Array<string> }> {
        return this.getBatchedValue<ActiveDirectoryGroup>(
            displayNames.map(p => `/groups?$filter=displayName${this.urlBlank}eq${this.urlBlank}'${p.replaceAll("#", this.urlHash)}'&${this.selectGroup}`),
            p => { p.type = 'Group'; return p; }
        );
    }

    private async getGroupsByIdBatched(ids: string[]): Promise<{ items: Array<ActiveDirectoryGroup>, failedRequests: Array<string> }> {
        return this.getBatched<ActiveDirectoryGroup>(
            ids.map(p => `/groups/${p}?${this.selectGroup}`),
            p => { p.type = 'Group'; return p; }
        );
    }

    private async getBatched<T>(urls: string[], mapper: (b: T) => T): Promise<{ items: Array<T>, failedRequests: Array<string> }> {

        const requestsAll = this.getBatchGetRequests(urls);

        const headers = await this.getHeaders();

        const collectionOk     = new Array<T     >();
        const collectionFailed = new Array<string>();

        for (const requests of requestsAll) {
            try {
                const data = JSON.stringify({ requests: requests });
            
                const response = await axios.post(`${this.microsoftGraphV1Endpoint}/\$batch`, data, { headers });

                if (response.status === 200) {
                    const itemsInResponse = response.data.responses as BatchResponse<T>[];

                    const itemsOk = itemsInResponse.filter(p => p.status === 200).map(p => mapper(p.body));

                    collectionOk.push(...itemsOk);

                    const failedRequestIds = itemsInResponse.filter(p => p.status !== 200).map(p => p.id);

                    for (const failedRequestId of failedRequestIds) {
                        const failedRequest = requests.find(p => `${p.id}` === `${failedRequestId}`);
                        collectionFailed.push(`${this.microsoftGraphV1Endpoint}${failedRequest?.url}`);
                    }
                }
                else {
                    collectionFailed.push(...requests.map(p => `${this.microsoftGraphV1Endpoint}${p.url}`));
                }
            }
            catch {
                collectionFailed.push(...requests.map(p => `${this.microsoftGraphV1Endpoint}${p.url}`));
            }
        }
        
        return { items: collectionOk, failedRequests: collectionFailed };
    }

    private async getBatchedValue<T>(urls: string[], mapper: (b: T) => T): Promise<{ items: Array<T>, failedRequests: Array<string> }> {

        const requestsAll = this.getBatchGetRequests(urls);

        const headers = await this.getHeaders();

        const collectionOk     = new Array<T     >();
        const collectionFailed = new Array<string>();

        for (const requests of requestsAll) {
            try {
                const data = JSON.stringify({ requests: requests });
            
                const response = await axios.post(`${this.microsoftGraphV1Endpoint}/\$batch`, data, { headers });

                if (response.status === 200) {
                    const itemsInResponse = response.data.responses as BatchResponseValue<T>[];

                    for(var items of itemsInResponse.filter(p => p.status === 200)){
                        // items.body.value is an Array<T>
                        for (const item of items.body.value) {
                            collectionOk.push(mapper(item));
                        }
                    }

                    const failedRequestIds = itemsInResponse.filter(p => p.status !== 200).map(p => p.id);

                    for (const failedRequestId of failedRequestIds) {
                        const failedRequest = requests.find(p => `${p.id}` === `${failedRequestId}`);
                        collectionFailed.push(`${this.microsoftGraphV1Endpoint}${failedRequest?.url}`);
                    }
                }
                else {
                    collectionFailed.push(...requests.map(p => `${this.microsoftGraphV1Endpoint}${p.url}`));
                }
            }
            catch {
                collectionFailed.push(...requests.map(p => `${this.microsoftGraphV1Endpoint}${p.url}`));
            }
        }
        
        return { items: collectionOk, failedRequests: collectionFailed };
    }

    private async getHeaders() {
        const token = await this.getToken();

        const headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };
        return headers;
    }

    private async getToken(): Promise<string> {
        const accessToken = await this.credential.getToken("https://graph.microsoft.com/.default");

        if (accessToken === null) { throw "Failed to retrieve accessToken for https://graph.microsoft.com/.default."; }

        return accessToken.token;
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