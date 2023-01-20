import { AzureRoleAssignmentsConverter } from "../AzureRoleAssignmentsConverter";
import { AzureRoleAssignmentsVerifier  } from "../AzureRoleAssignmentsVerifier";
import { RbacDefinition                } from "../models/RbacDefinition";
import { readFile                      } from "fs/promises";
import { RoleAssignment                } from "@azure/arm-authorization/esm/models";
import { RoleAssignmentHelper          } from "../RoleAssignmentHelper";
import { TokenCredential               } from "@azure/identity";

export class rbac_apply {
    static async handle(credentials: TokenCredential, subscriptionId: string, path: string) : Promise<void> {
        const startDate = new Date();

        try {
            const content = await readFile(path);
            const rbacDefinitions = JSON.parse(content.toString()) as RbacDefinition[];
            const roleAssignments = await new AzureRoleAssignmentsVerifier().verify(credentials, subscriptionId, rbacDefinitions);
            const roleAssignmentHelper = new RoleAssignmentHelper(credentials, subscriptionId);

            const newRoleAssignments       = new Array<RoleAssignment>();
            const newRoleAssignmentsFailed = new Array<RbacDefinition>();
            const roleAssignmentsMissingRbac = roleAssignments.items.filter(p => p.roleAssignmentStatus === 'missing-rbac');
            for (const item of roleAssignmentsMissingRbac) {
                if (item.roleAssignment.scope === undefined) {
                    newRoleAssignmentsFailed.push(...new AzureRoleAssignmentsConverter().mapExtendend([item]));
                }
                else if (item.roleAssignment.principalId === undefined) {
                    newRoleAssignmentsFailed.push(...new AzureRoleAssignmentsConverter().mapExtendend([item]));
                }
                else if (item.roleAssignment.roleDefinitionId === undefined) {
                    newRoleAssignmentsFailed.push(...new AzureRoleAssignmentsConverter().mapExtendend([item]));
                }
                else if (item.principal?.type === undefined) {
                    newRoleAssignmentsFailed.push(...new AzureRoleAssignmentsConverter().mapExtendend([item]));
                }
                else {
                    try {
                        const roleAssignment = await roleAssignmentHelper.setRoleAssignment(
                            item.roleAssignment.scope,
                            item.roleAssignment.principalId,
                            item.roleAssignment.roleDefinitionId,
                            item.principal.type
                        );

                        newRoleAssignments.push(roleAssignment);
                    }
                    catch {
                        newRoleAssignmentsFailed.push(...new AzureRoleAssignmentsConverter().mapExtendend([item]));
                    }
                }
            }

            const deletedRoleAssignments       = new Array<RoleAssignment>();
            const deletedRoleAssignmentsFailed = new Array<RbacDefinition>();
            const roleAssignmentsUnexpectedRbac = roleAssignments.items.filter(p => p.roleAssignmentStatus === 'unexpected-rbac');
            for (const item of roleAssignmentsUnexpectedRbac) {
                if (item.roleAssignment.scope === undefined) {
                    deletedRoleAssignmentsFailed.push(...new AzureRoleAssignmentsConverter().mapExtendend([item]));
                }
                else if (item.roleAssignment.name === undefined) {
                    deletedRoleAssignmentsFailed.push(...new AzureRoleAssignmentsConverter().mapExtendend([item]));
                }
                else {
                    try {
                        const deletedRoleAssignment = await roleAssignmentHelper.deleteRoleAssignment(
                            item.roleAssignment.scope,
                            item.roleAssignment.name
                        );

                        deletedRoleAssignments.push(deletedRoleAssignment);
                    }
                    catch {
                        deletedRoleAssignmentsFailed.push(...new AzureRoleAssignmentsConverter().mapExtendend([item]));
                    }
                }
            }

            console.log({
                parameters: {
                    subscriptionId,
                    path
                },
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000,
                newRoleAssignments,
                newRoleAssignmentsFailed,
                deletedRoleAssignments,
                deletedRoleAssignmentsFailed
            });
        } catch (e:any) {
            console.error(e); 
            throw e;
        }
    }
}