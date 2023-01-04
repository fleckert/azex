import { AuthorizationManagementClient  } from "@azure/arm-authorization";
import { PrincipalType, RoleAssignment, } from "@azure/arm-authorization/esm/models";
import { v4 as uuidv4                   } from "uuid";

export class RoleAssignmentHelper {
  constructor(
    readonly authorizationManagementClient: AuthorizationManagementClient
  ) {}

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
        uuidv4(),
        {
          principalId,
          roleDefinitionId,
          principalType,
        }
      );

    return reponse;
  }

  private async getRoleAssignment(
    scope           : string,
    principalId     : string,
    roleDefinitionId: string,
    principalType   : PrincipalType
  ): Promise<RoleAssignment | undefined> {
    const roleAssignments = await this.authorizationManagementClient.roleAssignments.listForScope(scope);

    for (const roleAssignment of roleAssignments) {
      if (this.checkRoleAssignment(roleAssignment, scope, principalId, roleDefinitionId, principalType)) {
        return roleAssignment;
      }
    }

    if (roleAssignments.nextLink !== undefined) {
      return await this.getRoleAssignmentNext(
        scope,
        principalId,
        roleDefinitionId,
        principalType,
        roleAssignments.nextLink
      );
    }

    return undefined;
  }

  private async getRoleAssignmentNext(
    scope           : string,
    principalId     : string,
    roleDefinitionId: string,
    principalType   : PrincipalType,
    nextPageLink    : string
  ): Promise<RoleAssignment | undefined> {
    const roleAssignments = await this.authorizationManagementClient.roleAssignments.listForScopeNext(nextPageLink);

    for (const roleAssignment of roleAssignments) {
      if (this.checkRoleAssignment(roleAssignment, scope, principalId, roleDefinitionId, principalType)) {
        return roleAssignment;
      }
    }

    if (roleAssignments.nextLink !== undefined) {
      return await this.getRoleAssignmentNext(
        scope,
        principalId,
        roleDefinitionId,
        principalType,
        roleAssignments.nextLink
      );
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

    const roleAssignments = await this.authorizationManagementClient.roleAssignments.listForScope(scope);

    roleAssignmentsAll.push(...roleAssignments);

    let nextLink = roleAssignments.nextLink;

    while (nextLink !== undefined) {
      const roleAssignmentsNext = await this.authorizationManagementClient.roleAssignments.listForScopeNext(nextLink);

      roleAssignmentsAll.push(...roleAssignmentsNext);

      nextLink = roleAssignmentsNext.nextLink;
    }

    return roleAssignmentsAll;
  }
}
