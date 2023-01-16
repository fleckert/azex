import axios from "axios";
import { ActiveDirectoryApplication                                        } from "./models/ActiveDirectoryApplication";
import { ActiveDirectoryGroup                                              } from "./models/ActiveDirectoryGroup";
import { ActiveDirectoryEntity, ActiveDirectoryEntitySorterByDisplayName   } from "./models/ActiveDirectoryEntity";
import { ActiveDirectoryServicePrincipal                                   } from "./models/ActiveDirectoryServicePrincipal";
import { ActiveDirectoryUser, ActiveDirectoryUserSorterByUserPrincipalName } from "./models/ActiveDirectoryUser";
import { TokenCredential                                                   } from "@azure/identity";

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

    getUsersById                     (ids                : string[]): Promise<{ items: Array<ActiveDirectoryUser            >, failedRequests: Array<string> }> { return this.getUsersByIdBatched                     (ids                ); }
    getGroupsById                    (ids                : string[]): Promise<{ items: Array<ActiveDirectoryGroup           >, failedRequests: Array<string> }> { return this.getGroupsByIdBatched                    (ids                ); }
    getServicePrincipalsById         (ids                : string[]): Promise<{ items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string> }> { return this.getServicePrincipalsByIdBatched         (ids                ); }

    getUsersByUserPrincipalName      (userPrincipalNames : string[]): Promise<{ items: Array<ActiveDirectoryUser            >, failedRequests: Array<string> }> { return this.getUsersByUserPrincipalNameBatched      (userPrincipalNames ); }
    getGroupsByDisplayName           (displayNames       : string[]): Promise<{ items: Array<ActiveDirectoryGroup           >, failedRequests: Array<string> }> { return this.getGroupsByDisplayNameBatched           (displayNames       ); }
    getServicePrincipalsByDisplayName(displayNames       : string[]): Promise<{ items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string> }> { return this.getServicePrincipalsByDisplayNameBatched(displayNames       ); }
    getServicePrincipalsByAppIds     (appIds             : string[]): Promise<{ items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string> }> { return this.getServicePrincipalsByAppIdBatched      (appIds             ); }
    getApplicationsByDisplayName     (displayNames       : string[]): Promise<{ items: Array<ActiveDirectoryApplication     >, failedRequests: Array<string> }> { return this.getApplicationsByDisplayNameBatched     (displayNames       ); }

    async getPrincipalsbyId(ids: string[]): Promise<{ items: Array<ActiveDirectoryEntity>, failedRequests: Array<string>}> {
        const usersPromise             = this.getUsersById            (ids);
        const groupsPromise            = this.getGroupsById           (ids);
        const serviceprincipalsPromise = this.getServicePrincipalsById(ids);

        const users             = await usersPromise;
        const groups            = await groupsPromise;
        const serviceprincipals = await serviceprincipalsPromise;

        const principals = new Array<ActiveDirectoryEntity>();
        principals.push(...users.items            );
        principals.push(...groups.items           );
        principals.push(...serviceprincipals.items);

        const failedRequests = new Array<string>();

        for (const id of ids) {
            if (principals.find(p => p.id.toLocaleLowerCase() === id.toLowerCase()) === undefined) {
                failedRequests.push(`${this.microsoftGraphV1Endpoint} - Failed to resolve id '${id}'.`);
            }
        }

        return { items: principals, failedRequests };
    }

    async createUser(
        accountEnabled   : boolean,
        displayName      : string,
        mailNickname     : string,
        userPrincipalName: string,
        passwordProfile: {
            forceChangePasswordNextSignIn: boolean,
            password                     : string
        }
    ): Promise<{ item: ActiveDirectoryUser | undefined; error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/graph/api/user-post-users
        
        const headers = await this.getHeaders();

        const data = JSON.stringify({
            accountEnabled,
            displayName,
            mailNickname,
            userPrincipalName,
            passwordProfile
        });

        try {
            const response = await axios.post(`${this.microsoftGraphV1Endpoint}/users`, data, { headers });

            if (response.status === 201) {
                const user = response.data as ActiveDirectoryUser;
                user.type = 'User';
                return { item: user, error: undefined };
            }
            else {
                return { item: undefined, error: new Error("Failed to create user.") };
            }
        }
        catch (error: any) {
            return { item: undefined, error: new Error(error.response.data.error.message)};
        }
    }

    async createGroup(
        displayName : string,
        mailEnabled : boolean,
        mailNickname: string
    ): Promise<{ item: ActiveDirectoryGroup | undefined; error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/graph/api/group-post-groups
        
        const headers = await this.getHeaders();

        const data = JSON.stringify({
            displayName,
            mailEnabled,
            mailNickname,
            securityEnabled: true
          });

        try {
            const response = await axios.post(`${this.microsoftGraphV1Endpoint}/groups`, data, { headers });

            if (response.status === 201) {
                const group = response.data as ActiveDirectoryGroup;
                group.type = 'Group';
                return { item: group, error: undefined };
            }
            else {
                return { item: undefined, error: new Error("Failed to create group.") };
            }
        }
        catch (error: any) {
            return { item: undefined, error: new Error(error.response.data.error.message)};
        }
    }

    async createApplication(
        displayName : string
    ): Promise<{ item: ActiveDirectoryApplication | undefined; error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/graph/api/application-post-applications
        
        const headers = await this.getHeaders();

        const data = JSON.stringify({ displayName });

        try {
            const response = await axios.post(`${this.microsoftGraphV1Endpoint}/applications`, data, { headers });

            if (response.status === 201) {
                const application = response.data as ActiveDirectoryServicePrincipal;
                application.type = 'Application';
                return { item: application, error: undefined };
            }
            else {
                return { item: undefined, error: new Error("Failed to create application.") };
            }
        }
        catch (error: any) {
            return { item: undefined, error: new Error(error.response.data.error.message)};
        }
    }

    async createServicePrincipal(
        appId : string
    ): Promise<{ item: ActiveDirectoryServicePrincipal | undefined; error: Error | undefined }> {
        // https://learn.microsoft.com/en-us/graph/api/serviceprincipal-post-serviceprincipals
        
        const headers = await this.getHeaders();

        const data = JSON.stringify({ appId });

        try {
            const response = await axios.post(`${this.microsoftGraphV1Endpoint}/servicePrincipals`, data, { headers });

            if (response.status === 201) {
                const servicePrincipal = response.data as ActiveDirectoryServicePrincipal;
                servicePrincipal.type = 'ServicePrincipal';
                return { item: servicePrincipal, error: undefined };
            }
            else {
                return { item: undefined, error: new Error("Failed to create group.") };
            }
        }
        catch (error: any) {
            return { item: undefined, error: new Error(error.response.data.error.message)};
        }
    }

    private getServicePrincipalsByIdBatched(ids: string[]): Promise<{items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string>}>{
        return this.getBatched<ActiveDirectoryServicePrincipal>(
            ids.map(p => `/serviceprincipals/${p}?${this.selectServicePrincipal}`),
            p => { p.type = 'ServicePrincipal'; return p; },
            ActiveDirectoryEntitySorterByDisplayName
        );
    }

    private async getServicePrincipalsByDisplayNameBatched(displayNames: string[]): Promise<{items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string>}>{
        const getUrl = (displayName : string) => `/serviceprincipals?$filter=displayName${this.urlBlank}eq${this.urlBlank}'${displayName.replaceAll("#", this.urlHash)}'&${this.selectServicePrincipal}`
        
        const result = await this.getBatchedValue<ActiveDirectoryServicePrincipal>(
            displayNames.map(getUrl),
            p => { p.type = 'ServicePrincipal'; return p; },
            ActiveDirectoryEntitySorterByDisplayName
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

    private getServicePrincipalsByAppIdBatched(appIds: string[]): Promise<{ items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string> }> {
        const getUrl = (appId: string) => `/serviceprincipals?$filter=appId${this.urlBlank}eq${this.urlBlank}'${appId.replaceAll("#", this.urlHash)}'&${this.selectServicePrincipal}`

        return this.getBatchedValue<ActiveDirectoryServicePrincipal>(
            appIds.map(getUrl),
            p => { p.type = 'ServicePrincipal'; return p; },
            ActiveDirectoryEntitySorterByDisplayName
        );
    }

    private async getApplicationsByDisplayNameBatched(displayNames: string[]): Promise<{items: Array<ActiveDirectoryApplication>, failedRequests: Array<string>}>{
        const getUrl = (displayName : string) => `/applications?$filter=displayName${this.urlBlank}eq${this.urlBlank}'${displayName.replaceAll("#", this.urlHash)}'&${this.selectServicePrincipal}`
        
        const result = await this.getBatchedValue<ActiveDirectoryApplication>(
            displayNames.map(getUrl),
            p => { p.type = 'Application'; return p; },
            ActiveDirectoryEntitySorterByDisplayName
        );

        // applicationNames may not be unique, check for duplicates
        const resultChecked = {items: new Array<ActiveDirectoryApplication>(), failedRequests: new Array<string>()};
        resultChecked.failedRequests.push(...result.failedRequests);

        const applicationDisplayNames = new Set(result.items.map(p => p.displayName));

        for (const displayName of applicationDisplayNames) {
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

    private getUsersByIdBatched(ids: string[]): Promise<{items: Array<ActiveDirectoryUser>, failedRequests: Array<string>}> 
    {
        return this.getBatched<ActiveDirectoryUser>(
            ids.map(p => `/users/${p}?${this.selectUser}`),
            p => { p.type = 'User'; return p; },
            ActiveDirectoryUserSorterByUserPrincipalName
        );
    }

    private getUsersByUserPrincipalNameBatched(userPrincipalNames: string[]): Promise<{ items: Array<ActiveDirectoryUser>, failedRequests: Array<string> }> {
        return this.getBatchedValue<ActiveDirectoryUser>(
            userPrincipalNames.map(p => `/users?$filter=userPrincipalName${this.urlBlank}eq${this.urlBlank}'${p.replaceAll("#", this.urlHash)}'&${this.selectUser}`),
            p => { p.type = 'User'; return p; },
            ActiveDirectoryUserSorterByUserPrincipalName
        );
    }

    private getGroupsByDisplayNameBatched(displayNames: string[]): Promise<{ items: Array<ActiveDirectoryGroup>, failedRequests: Array<string> }> {
        return this.getBatchedValue<ActiveDirectoryGroup>(
            displayNames.map(p => `/groups?$filter=displayName${this.urlBlank}eq${this.urlBlank}'${p.replaceAll("#", this.urlHash)}'&${this.selectGroup}`),
            p => { p.type = 'Group'; return p; },
            ActiveDirectoryEntitySorterByDisplayName
        );
    }

    private getGroupsByIdBatched(ids: string[]): Promise<{ items: Array<ActiveDirectoryGroup>, failedRequests: Array<string> }> {
        return this.getBatched<ActiveDirectoryGroup>(
            ids.map(p => `/groups/${p}?${this.selectGroup}`),
            p => { p.type = 'Group'; return p; },
            ActiveDirectoryEntitySorterByDisplayName
        );
    }

    private async getBatched<T>(urls: string[], mapper: (b: T) => T, sorter: (a: T, b: T) => number): Promise<{ items: Array<T>, failedRequests: Array<string> }> {

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

        collectionOk.sort(sorter);
        collectionFailed.sort();

        return { items: collectionOk, failedRequests: collectionFailed };
    }

    private async getBatchedValue<T>(urls: string[], mapper: (b: T) => T, sorter: (a: T, b: T) => number): Promise<{ items: Array<T>, failedRequests: Array<string> }> {

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

        collectionOk.sort(sorter);
        collectionFailed.sort();

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

        /// resolve domain from upn
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