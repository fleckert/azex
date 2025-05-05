import { AuthorizationManagementClient, RoleDefinition } from "@azure/arm-authorization";
import { TokenCredential                               } from "@azure/identity";

export class RoleDefinitionHelper {

    readonly authorizationManagementClient : AuthorizationManagementClient;

    constructor(
        readonly credentials: TokenCredential,
        readonly subscriptionId: string
    ) {
        this.authorizationManagementClient = new AuthorizationManagementClient(credentials, subscriptionId);
    }


    async getRoleDefinition(
        subscriptionId: string,
        roleName      : string
    ): Promise<RoleDefinition | undefined> {
        const roleDefinitions = this.authorizationManagementClient.roleDefinitions.list(`/subscriptions/${subscriptionId}`);

        for await (const roleDefinition of roleDefinitions) {
            if (this.checkRoleDefinition(roleDefinition, roleName)) {
                return roleDefinition;
            }
        }

        return undefined;
    }

    private checkRoleDefinition(
        roleDefinition: RoleDefinition,
        roleName      : string
    ): boolean {
        // roleNames are not case-sensitive
        return roleDefinition.roleName?.toLowerCase() === roleName.toLowerCase();
    }

    async listAllForScope(scope: string): Promise<Array<RoleDefinition>> {

        const roleDefinitionsAll = new Array<RoleDefinition>();

        const roleDefinitions = this.authorizationManagementClient.roleDefinitions.list(scope);

        for await (const roleDefinition of roleDefinitions) {
            roleDefinitionsAll.push(roleDefinition);
        }

        return roleDefinitionsAll;
    }

    async listAllForScopeById(scope: string, roleDefinitionIds: Array<string>, roleDefinitionNames: Array<string>): Promise<Array<RoleDefinition>> {

        const roleDefinitionsAll = new Array<RoleDefinition>();

        const roleDefinitions = this.authorizationManagementClient.roleDefinitions.list(scope);

        for await (const roleDefinition of roleDefinitions) {
            if (roleDefinitionIds.find(p => roleDefinition.id?.toLowerCase() === p.toLowerCase()) !== undefined) {
                roleDefinitionsAll.push(roleDefinition);
            }
            else if (roleDefinitionNames.find(p => roleDefinition.roleName?.toLowerCase() === p.toLowerCase()) !== undefined) {
                roleDefinitionsAll.push(roleDefinition);
            }
        }

        return roleDefinitionsAll;
    }
}
