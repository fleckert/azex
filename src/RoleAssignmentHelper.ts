import { AuthorizationManagementClient, PrincipalType, RoleAssignment } from "@azure/arm-authorization";
import { Guid                                                         } from "./Guid";
import { TokenCredential                                              } from "@azure/identity";

export class RoleAssignmentHelper {

  readonly authorizationManagementClient: AuthorizationManagementClient;

  constructor(
    readonly credentials   : TokenCredential,
    readonly subscriptionId: string
  ) {
    this.authorizationManagementClient = new AuthorizationManagementClient(credentials, subscriptionId);
  }

  async setRoleAssignment(
    scope           : string,
    principalId     : string,
    roleDefinitionId: string,
    principalType   : PrincipalType
  ): Promise<RoleAssignment> {
    const roleAssignment = await this.getRoleAssignment(
      scope,
      principalId,
      roleDefinitionId,
      principalType
    );

    if (roleAssignment !== undefined) {
      return roleAssignment;
    }

    const reponse =
      await this.authorizationManagementClient.roleAssignments.create(
        scope,
        Guid.newGuid(),
        {
          principalId,
          roleDefinitionId,
          principalType,
        }
      );

    return reponse;
  }

  deleteRoleAssignment(
    scope             : string,
    roleAssignmentName: string
  ): Promise<RoleAssignment> {
      return this.authorizationManagementClient.roleAssignments.delete(
        scope,
        roleAssignmentName
      );
  }

  private async getRoleAssignment(
    scope           : string,
    principalId     : string,
    roleDefinitionId: string,
    principalType   : PrincipalType
  ): Promise<RoleAssignment | undefined> {
    const roleAssignments = this.authorizationManagementClient.roleAssignments.listForScope(scope);

    for await(const roleAssignment of roleAssignments) {
      if (this.checkRoleAssignment(roleAssignment, scope, principalId, roleDefinitionId, principalType)) {
        return roleAssignment;
      }
    }

    return undefined;
  }

  private checkRoleAssignment(
    roleAssignment  : RoleAssignment,
    scope           : string,
    principalId     : string,
    roleDefinitionId: string,
    principalType   : PrincipalType
  ): boolean {
    if (roleAssignment.scope?.           toLowerCase() !== scope           .toLowerCase()) { return false; }
    if (roleAssignment.principalId?.     toLowerCase() !== principalId     .toLowerCase()) { return false; }
    if (roleAssignment.principalType?.   toLowerCase() !== principalType   .toLowerCase()) { return false; }
    if (roleAssignment.roleDefinitionId?.toLowerCase() !== roleDefinitionId.toLowerCase()) { return false; }

    return true;
  }

  async listAllForScope(scope: string): Promise<Array<RoleAssignment>> {
    const roleAssignmentsAll = new Array<RoleAssignment>();

    const roleAssignments = this.authorizationManagementClient.roleAssignments.listForScope(scope);

    for await (const roleAssignment of roleAssignments) {
      roleAssignmentsAll.push(roleAssignment);
    }

    return roleAssignmentsAll;
  }

  static isManagementGroupScope(roleAssignment: RoleAssignment | undefined): boolean {
    return roleAssignment?.scope?.startsWith('/providers/Microsoft.Management/managementGroups/') === true;
  }

  static getManagementGroupName(roleAssignment: RoleAssignment | undefined): string | undefined {
    return this.isManagementGroupScope(roleAssignment)
         ? roleAssignment?.scope?.replace('/providers/Microsoft.Management/managementGroups/', '')
         : undefined;
  }
}
