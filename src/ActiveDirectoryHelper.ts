import axios from "axios";
import { ActiveDirectoryApplication                                                                 } from "./models/ActiveDirectoryApplication";
import { ActiveDirectoryGroup                                                                       } from "./models/ActiveDirectoryGroup";
import { ActiveDirectoryEntity, ActiveDirectoryEntitySorterByDisplayName, ActiveDirectoryEntityType } from "./models/ActiveDirectoryEntity";
import { ActiveDirectoryServicePrincipal                                                            } from "./models/ActiveDirectoryServicePrincipal";
import { ActiveDirectoryUser, ActiveDirectoryUserSorterByUserPrincipalName                          } from "./models/ActiveDirectoryUser";
import { Guid                                                                                       } from "./Guid";
import { TokenCredential                                                                            } from "@azure/identity";

interface BatchResponse<ActiveDirectoryEntity> {
    id    : number
    status: number
    body  : { '@odata.context': string} & ActiveDirectoryEntity
}

interface BatchResponseValue<ActiveDirectoryEntity> {
    id    : number
    status: number
    body  : { '@odata.context': string } & { value: Array<ActiveDirectoryEntity> }
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
    private readonly selectApplication      = '$select=id,displayName,appId';
    private readonly selectGroup            = '$select=id,displayName';


    constructor(
        readonly credentials: TokenCredential
    ) { }

    async getUsers(count?: number): Promise<ActiveDirectoryUser[]> {
        const headers = await this.getHeaders();

        const collection = new Array<ActiveDirectoryUser>();

        let url = `${this.microsoftGraphV1Endpoint}/users?${this.selectUser}`;

        while (url !== undefined) {
            const response = await axios.get(url, { headers });

            if (response.status === 200) {
                const itemsInResponse = response.data.value as ActiveDirectoryUser[];
                collection.push(...itemsInResponse);
                url = response.data['@odata.nextLink'];

                if (count !== undefined && collection.length >= count) {
                    break;
                }
                console.log(collection.length)
            }
            else {
                throw new Error(JSON.stringify({url, status: response.status}));
            }
        }

        return collection.slice(0, count);
    }

    getUsersById                     (ids                : string[]): Promise<{ items: Array<ActiveDirectoryUser            >, failedRequests: Array<string> }> { return this.getUsersByIdBatched                     (ids                ); }
    getGroupsById                    (ids                : string[]): Promise<{ items: Array<ActiveDirectoryGroup           >, failedRequests: Array<string> }> { return this.getGroupsByIdBatched                    (ids                ); }
    getServicePrincipalsById         (ids                : string[]): Promise<{ items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string> }> { return this.getServicePrincipalsByIdBatched         (ids                ); }
    getApplicationsById              (ids                : string[]): Promise<{ items: Array<ActiveDirectoryApplication     >, failedRequests: Array<string> }> { return this.getApplicationsByIdBatched              (ids                ); }

    getUsersByUserPrincipalName      (userPrincipalNames : string[]): Promise<{ items: Array<ActiveDirectoryUser            >, failedRequests: Array<string> }> { return this.getUsersByUserPrincipalNameBatched      (userPrincipalNames ); }
    getGroupsByDisplayName           (displayNames       : string[]): Promise<{ items: Array<ActiveDirectoryGroup           >, failedRequests: Array<string> }> { return this.getGroupsByDisplayNameBatched           (displayNames       ); }
    getServicePrincipalsByDisplayName(displayNames       : string[]): Promise<{ items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string> }> { return this.getServicePrincipalsByDisplayNameBatched(displayNames       ); }
    getServicePrincipalsByAppIds     (appIds             : string[]): Promise<{ items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string> }> { return this.getServicePrincipalsByAppIdBatched      (appIds             ); }
    getApplicationsByDisplayName     (displayNames       : string[]): Promise<{ items: Array<ActiveDirectoryApplication     >, failedRequests: Array<string> }> { return this.getApplicationsByDisplayNameBatched     (displayNames       ); }

    async getPrincipalsbyId(ids: string[]): Promise<{ items: Array<ActiveDirectoryEntity>, failedRequests: Array<string>}> {
        const idsValid = ids.filter(id => Guid.isGuid(id));

        const usersPromise             = this.getUsersByIdBatched            (idsValid);
        const groupsPromise            = this.getGroupsByIdBatched           (idsValid);
        const serviceprincipalsPromise = this.getServicePrincipalsByIdBatched(idsValid);
        const applicationsPromise      = this.getApplicationsByIdBatched     (idsValid);

        const users             = await usersPromise;
        const groups            = await groupsPromise;
        const serviceprincipals = await serviceprincipalsPromise;
        const applications      = await applicationsPromise;

        const principals = new Array<ActiveDirectoryEntity>();
        principals.push(...users            .items);
        principals.push(...groups           .items);
        principals.push(...serviceprincipals.items);
        principals.push(...applications     .items);

        const failedRequests = new Array<string>();

        for (const id of ids) {
            if (principals.find(p => p.id.toLocaleLowerCase() === id.toLowerCase()) === undefined) {

                const userFailedRequests             = users            .failedRequests.filter(p => p.indexOf(id));
                const groupFailedRequests            = groups           .failedRequests.filter(p => p.indexOf(id));
                const servicePrincipalFailedRequests = serviceprincipals.failedRequests.filter(p => p.indexOf(id));
                const applicationFailedRequests      = applications     .failedRequests.filter(p => p.indexOf(id));

                const failedRequestsAll = [
                    ...userFailedRequests,
                    ...groupFailedRequests,
                    ...servicePrincipalFailedRequests,
                    ...applicationFailedRequests
                ];

                failedRequestsAll.sort();

                failedRequests.push(JSON.stringify({
                    message: `${this.microsoftGraphV1Endpoint} - Failed to resolve id '${id}'.`,
                    failedRequests: failedRequestsAll
                }, null, 2));
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
        // https://learn.microsoft.com/en-us/azure/active-directory/authentication/concept-sspr-policy#userprincipalname-policies-that-apply-to-all-user-accounts

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
                const item = response.data as ActiveDirectoryUser;
                item.type = this.mapODataContext(response.data["@odata.context"]);
                return { item, error: undefined };
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
                const item = response.data as ActiveDirectoryGroup;
                item.type = this.mapODataContext(response.data["@odata.context"]);
                return { item, error: undefined };
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
                const item = response.data as ActiveDirectoryServicePrincipal;
                item.type = this.mapODataContext(response.data["@odata.context"]);
                return { item, error: undefined };
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
                const item = response.data as ActiveDirectoryServicePrincipal;
                item.type = this.mapODataContext(response.data["@odata.context"]);
                return { item, error: undefined };
            }
            else {
                return { item: undefined, error: new Error("Failed to create group.") };
            }
        }
        catch (error: any) {
            return { item: undefined, error: new Error(error.response.data.error.message)};
        }
    }

    private getServicePrincipalsByIdBatched(ids: string[]): Promise<{ items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string> }> {
        const getUrl = (id: string) => `/serviceprincipals/${id}?${this.selectServicePrincipal}`;
        return this.getBatched<ActiveDirectoryServicePrincipal>(ids.map(getUrl), ActiveDirectoryEntitySorterByDisplayName);
    }

    
    private getApplicationsByIdBatched(ids: string[]): Promise<{ items: Array<ActiveDirectoryApplication>, failedRequests: Array<string> }> {
        const getUrl = (id: string) => `/applications/${id}?${this.selectApplication}`;
        return this.getBatched<ActiveDirectoryApplication>(ids.map(getUrl), ActiveDirectoryEntitySorterByDisplayName);
    }

    private getGroupsByIdBatched(ids: string[]): Promise<{ items: Array<ActiveDirectoryGroup>, failedRequests: Array<string> }> {
        const getUrl = (id: string) => `/groups/${id}?${this.selectGroup}`;
        return this.getBatched<ActiveDirectoryGroup>(ids.map(getUrl), ActiveDirectoryEntitySorterByDisplayName);
    }

    private getUsersByIdBatched(ids: string[]): Promise<{ items: Array<ActiveDirectoryUser>, failedRequests: Array<string> }> {
        const getUrl = (id: string) => `/users/${id}?${this.selectUser}`
        return this.getBatched<ActiveDirectoryUser>(ids.map(getUrl), ActiveDirectoryUserSorterByUserPrincipalName);
    }

    private getUsersByUserPrincipalNameBatched(userPrincipalNames: string[]): Promise<{ items: Array<ActiveDirectoryUser>, failedRequests: Array<string> }> {
        const getUrl = (userPrincipalName: string) => `/users?$filter=userPrincipalName${this.urlBlank}eq${this.urlBlank}'${this.escapeForODataFilter(userPrincipalName)}'&${this.selectUser}`;
        return this.getBatchedValue<ActiveDirectoryUser>(userPrincipalNames.map(getUrl), ActiveDirectoryUserSorterByUserPrincipalName);
    }

    private async getServicePrincipalsByDisplayNameBatched(displayNames: string[]): Promise<{ items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string> }> {
        const getUrl = (displayName: string) => `/serviceprincipals?$filter=displayName${this.urlBlank}eq${this.urlBlank}'${this.escapeForODataFilter(displayName)}'&${this.selectServicePrincipal}`
        const result = await this.getBatchedValue<ActiveDirectoryServicePrincipal>(displayNames.map(getUrl), ActiveDirectoryEntitySorterByDisplayName);
        return this.checkForUniqueDisplayNames(result, displayName=> `ServicePrincipals - displayName '${displayName}' is not unique.` );
    }

    private getServicePrincipalsByAppIdBatched(appIds: string[]): Promise<{ items: Array<ActiveDirectoryServicePrincipal>, failedRequests: Array<string> }> {
        const getUrl = (appId: string) => `/serviceprincipals?$filter=appId${this.urlBlank}eq${this.urlBlank}'${appId}'&${this.selectServicePrincipal}`
        return this.getBatchedValue<ActiveDirectoryServicePrincipal>(appIds.map(getUrl), ActiveDirectoryEntitySorterByDisplayName);
    }

    private async getApplicationsByDisplayNameBatched(displayNames: string[]): Promise<{ items: Array<ActiveDirectoryApplication>, failedRequests: Array<string> }> {
        const getUrl = (displayName: string) => `/applications?$filter=displayName${this.urlBlank}eq${this.urlBlank}'${this.escapeForODataFilter(displayName)}'&${this.selectApplication}`
        const result = await this.getBatchedValue<ActiveDirectoryApplication>(displayNames.map(getUrl), ActiveDirectoryEntitySorterByDisplayName);
        return this.checkForUniqueDisplayNames(result, displayName=> `Applications - displayName '${displayName}' is not unique.` );
    }

    private async getGroupsByDisplayNameBatched(displayNames: string[]): Promise<{ items: Array<ActiveDirectoryGroup>, failedRequests: Array<string> }> {
        const getUrl = (displayName: string) => `/groups?$filter=displayName${this.urlBlank}eq${this.urlBlank}'${this.escapeForODataFilter(displayName)}'&${this.selectGroup}`
        const result = await this.getBatchedValue<ActiveDirectoryGroup>(displayNames.map(getUrl), ActiveDirectoryEntitySorterByDisplayName);
        return this.checkForUniqueDisplayNames(result, displayName=> `Groups - displayName '${displayName}' is not unique.` );
    }



    private async getBatched<T extends ActiveDirectoryEntity>(urls: string[], sorter: (a: T, b: T) => number): Promise<{ items: Array<T>, failedRequests: Array<string> }> {

        if (urls.length === 0) { 
            return { items: [], failedRequests: [] };
        }

        const requestsAll = this.getBatchGetRequests(urls);

        const headers = await this.getHeaders();

        const collectionOk     = new Array<T>();
        const collectionFailed = new Array<string>();

        for (const requests of requestsAll) {
            try {
                const data = JSON.stringify({ requests: requests });
            
                const response = await axios.post(`${this.microsoftGraphV1Endpoint}/\$batch`, data, { headers });

                if (response.status === 200) {
                    const itemsInResponse = response.data.responses as BatchResponse<T>[];

                    const itemsOk = itemsInResponse.filter(p => p.status === 200).map(p => { p.body.type = this.mapODataContext(p.body["@odata.context"]); return p.body; });

                    collectionOk.push(...itemsOk);

                    const itemsInResponeFailed = itemsInResponse.filter(p => p.status !== 200);

                    for (const item of itemsInResponeFailed) {
                        const request = requests.find(p => `${p.id}` === `${item.id}`);
                        collectionFailed.push(`${this.microsoftGraphV1Endpoint}${request?.url} [${(item as any).body?.error?.code}] [${(item as any).body?.error.message}]`);
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

    private async getBatchedValue<T extends ActiveDirectoryEntity>(urls: string[], sorter: (a: T, b: T) => number): Promise<{ items: Array<T>, failedRequests: Array<string> }> {

        if (urls.length === 0) {
            return { items: [], failedRequests: [] };
        }

        const requestsAll = this.getBatchGetRequests(urls);

        const headers = await this.getHeaders();

        const collectionOk     = new Array<T>();
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
                            item.type = this.mapODataContext(items.body["@odata.context"]);
                            collectionOk.push(item);
                        }
                    }

                    const itemsInResponseFailed = itemsInResponse.filter(p => p.status !== 200);

                    for (const item of itemsInResponseFailed) {
                        const request = requests.find(p => `${p.id}` === `${item.id}`);
                        collectionFailed.push(`${this.microsoftGraphV1Endpoint}${request?.url} [${(item as any).body?.error?.code}] [${(item as any).body?.error?.message}]`);
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
        const accessToken = await this.credentials.getToken("https://graph.microsoft.com/.default");

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

    private mapODataContext(odataContext: string): ActiveDirectoryEntityType {
        if (odataContext.startsWith(`${this.microsoftGraphV1Endpoint}/$metadata#applications(`     ) && odataContext.endsWith(')'        )) { return 'Application'     ; }
        if (odataContext.startsWith(`${this.microsoftGraphV1Endpoint}/$metadata#applications(`     ) && odataContext.endsWith(')/$entity')) { return 'Application'     ; }
        if (odataContext.startsWith(`${this.microsoftGraphV1Endpoint}/$metadata#applications`      ) && odataContext.endsWith('/$entity' )) { return 'Application'     ; }
        if (odataContext.startsWith(`${this.microsoftGraphV1Endpoint}/$metadata#groups(`           ) && odataContext.endsWith(')'        )) { return 'Group'           ; }
        if (odataContext.startsWith(`${this.microsoftGraphV1Endpoint}/$metadata#groups(`           ) && odataContext.endsWith(')/$entity')) { return 'Group'           ; }
        if (odataContext.startsWith(`${this.microsoftGraphV1Endpoint}/$metadata#groups`            ) && odataContext.endsWith('/$entity' )) { return 'Group'           ; }
        if (odataContext.startsWith(`${this.microsoftGraphV1Endpoint}/$metadata#servicePrincipals(`) && odataContext.endsWith(')'        )) { return 'ServicePrincipal'; }
        if (odataContext.startsWith(`${this.microsoftGraphV1Endpoint}/$metadata#servicePrincipals(`) && odataContext.endsWith(')/$entity')) { return 'ServicePrincipal'; }
        if (odataContext.startsWith(`${this.microsoftGraphV1Endpoint}/$metadata#servicePrincipals` ) && odataContext.endsWith('/$entity' )) { return 'ServicePrincipal'; }
        if (odataContext.startsWith(`${this.microsoftGraphV1Endpoint}/$metadata#users(`            ) && odataContext.endsWith(')'        )) { return 'User'            ; }
        if (odataContext.startsWith(`${this.microsoftGraphV1Endpoint}/$metadata#users(`            ) && odataContext.endsWith(')/$entity')) { return 'User'            ; }
        if (odataContext.startsWith(`${this.microsoftGraphV1Endpoint}/$metadata#users`             ) && odataContext.endsWith('/$entity' )) { return 'User'            ; }

        throw new Error(`Failed to map '${odataContext}'.`);
    }

    private escapeForODataFilter(value: string): string {
        return value.replaceAll("#", this.urlHash).replaceAll("'", "''");
    }

    private checkForUniqueDisplayNames<T extends ActiveDirectoryEntity>(
        result: { items: Array<T>, failedRequests: Array<string> },
        failedRequestMapper: (value: string) => string
    ): { items: Array<T>, failedRequests: Array<string> } {
        const resultChecked = { items: new Array<T>(), failedRequests: new Array<string>() };
        resultChecked.failedRequests.push(...result.failedRequests);

        const existingDisplayNames = new Set(result.items.map(p => p.displayName));

        for (const displayName of existingDisplayNames) {
            const itemsForDisplayName = result.items.filter(p => p.displayName.toLowerCase() === displayName.toLowerCase());

            if (itemsForDisplayName.length === 1) {
                resultChecked.items.push(itemsForDisplayName[0]);
            }
            else {
                resultChecked.failedRequests.push(failedRequestMapper(displayName));
            }
        }

        return resultChecked;
    }
}