import { ActiveDirectoryHelper         } from "../ActiveDirectoryHelper";
import { AuthorizationManagementClient } from "@azure/arm-authorization";
import { DefaultAzureCredential        } from "@azure/identity";
import { RbacDefinition                } from "../models/RbacDefinition";
import { readFile                      } from "fs/promises";
import { RoleAssignmentHelper          } from "../RoleAssignmentHelper";
import { RoleAssignment } from "@azure/arm-authorization/esm/models";

export class rbac_apply {
    static async handle(subscriptionId: string, path: string) {
        const startDate = new Date();

        readFile(path)
        .then(p => JSON.parse(p.toString()) as RbacDefinition[])
        .then(async rbacDefinitions => {
            const credential = new DefaultAzureCredential();
            const authorizationManagementClient = new AuthorizationManagementClient(credential, subscriptionId);
            const roleAssignmentHelper = new RoleAssignmentHelper(authorizationManagementClient);
            const activeDirectoryHelper = new ActiveDirectoryHelper(credential);

            const principalIds = new Set(rbacDefinitions.map(p => p.principalId));
            const principals = await activeDirectoryHelper.getPrincipalsbyId([...principalIds]);

            const roleAssignments = new Array<RoleAssignment>();
            const failedRequests  = new Array<RbacDefinition>();

            for (const item of rbacDefinitions) {
                const principal = principals.items.filter(p => p.id.toLowerCase() === item.principalId.toLowerCase())[0];

                try {
                    const roleAssignment = await roleAssignmentHelper.setRoleAssignment(
                        item.scope,
                        item.principalId,
                        item.roleDefinitionId,
                        principal.type
                    );

                    roleAssignments.push(roleAssignment);
                    console.log({ item, roleAssignment });
                }
                catch (e: any) {
                    failedRequests.push(item);
                    console.log({ item, e });
                }
            }

            return {roleAssignments, failedRequests};
        })
        .then(p => {
            const endDate = new Date();

            const durationInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;

            console.log({
                durationInSeconds,
                failedRequests: p.failedRequests,
                roleAssignments: p.roleAssignments
            });
        })
        .catch(p => console.error(p));
    }
}