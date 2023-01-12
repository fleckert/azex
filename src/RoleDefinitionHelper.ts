import { AuthorizationManagementClient } from "@azure/arm-authorization";
import { RoleDefinition                } from "@azure/arm-authorization/esm/models";
import { TokenCredential               } from "@azure/identity";

export class RoleDefinitionHelper {

    readonly authorizationManagementClient : AuthorizationManagementClient;

    constructor(
        readonly credential: TokenCredential,
        readonly subscriptionId: string
    ) {
        this.authorizationManagementClient = new AuthorizationManagementClient(credential, subscriptionId);
    }


    async getRoleDefinition(
        subscriptionId: string,
        roleName      : string
    ): Promise<RoleDefinition | undefined> {
        const roleDefinitions = await this.authorizationManagementClient.roleDefinitions.list(`/subscriptions/${subscriptionId}`);

        for (const roleDefinition of roleDefinitions) {
            if (this.checkRoleDefinition(roleDefinition, roleName)) {
                return roleDefinition;
            }
        }

        if (roleDefinitions.nextLink !== undefined) {
            return await this.getRoleDefinitionNext(roleName, roleDefinitions.nextLink);
        }

        return undefined;
    }

    private async getRoleDefinitionNext(
        roleName        : string,
        nextPageLink    : string
    ): Promise<RoleDefinition | undefined> {

        const roleDefinitions = await this.authorizationManagementClient.roleDefinitions.listNext(nextPageLink);

        for (const roleDefinition of roleDefinitions) {
            if (this.checkRoleDefinition(roleDefinition, roleName)) {
                return roleDefinition;
            }
        }

        if (roleDefinitions.nextLink !== undefined) {
            return await this.getRoleDefinitionNext(roleName, roleDefinitions.nextLink);
        }

        return undefined;
    }

    private checkRoleDefinition(
        roleDefinition: RoleDefinition,
        roleName      : string
    ): boolean {
        return roleDefinition.roleName === roleName;
    }

    async listAllForScope(scope: string): Promise<Array<RoleDefinition>> {

        const roleDefinitionsAll = new Array<RoleDefinition>();

        const roleDefinitions = await this.authorizationManagementClient.roleDefinitions.list(scope);

        roleDefinitionsAll.push(...roleDefinitions);

        let nextLink = roleDefinitions.nextLink;

        while (nextLink !== undefined) {
            const roleDefinitionsNext = await this.authorizationManagementClient.roleDefinitions.listNext(nextLink);

            roleDefinitionsAll.push(...roleDefinitionsNext);

            nextLink = roleDefinitionsNext.nextLink;
        }

        return roleDefinitionsAll;
    }

    async listAllForScopeById(scope: string, roleDefinitionIds: Array<string>, roleDefinitionNames: Array<string>): Promise<Array<RoleDefinition>> {

        const roleDefinitionsAll = new Array<RoleDefinition>();

        const roleDefinitions = await this.authorizationManagementClient.roleDefinitions.list(scope);

        for (const roleDefinition of roleDefinitions) {
            if (roleDefinitionIds.filter(p => roleDefinition.id?.toLowerCase() === p.toLowerCase())[0] !== undefined) {
                roleDefinitionsAll.push(roleDefinition);
            }
            else if(roleDefinitionNames.filter(p => roleDefinition.roleName?.toLowerCase() === p.toLowerCase())[0] !== undefined){
                roleDefinitionsAll.push(roleDefinition);
            }
        }

        let nextLink = roleDefinitions.nextLink;

        while (nextLink !== undefined) {
            const roleDefinitionsNext = await this.authorizationManagementClient.roleDefinitions.listNext(nextLink);

            for (const roleDefinition of roleDefinitionsNext) {
                if (roleDefinitionIds.filter(p => roleDefinition.id === p)[0] !== undefined) {
                    roleDefinitionsAll.push(roleDefinition);
                }
                else if(roleDefinitionNames.filter(p => roleDefinition.roleName?.toLowerCase() === p.toLowerCase())[0] !== undefined){
                    roleDefinitionsAll.push(roleDefinition);
                }
            }

            nextLink = roleDefinitionsNext.nextLink;
        }

        return roleDefinitionsAll;
    }
}
