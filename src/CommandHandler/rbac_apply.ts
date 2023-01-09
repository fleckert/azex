import { AuthorizationManagementClient    } from "@azure/arm-authorization";
import { DefaultAzureCredential           } from "@azure/identity";
import { RbacDefinition, RbacDefinitionEx } from "../models/RbacDefinition";
import { readFile                         } from "fs/promises";
import { RoleAssignment                   } from "@azure/arm-authorization/esm/models";
import { RoleAssignmentHelper             } from "../RoleAssignmentHelper";
import { AzureRoleAssignmentsVerifier     } from "../AzureRoleAssignmentsVerifier";
import { AzureRoleAssignmentsConverter    } from "../AzureRoleAssignmentsConverter";

export class rbac_apply {
    static async handle(subscriptionId: string, path: string) {
        const startDate = new Date();

        readFile(path)
        .then(p => JSON.parse(p.toString()) as RbacDefinition[])
        .then(async rbacDefinitions => {

            const credential = new DefaultAzureCredential();
            const roleAssignments = await new AzureRoleAssignmentsVerifier().verify(credential, subscriptionId, rbacDefinitions);

            const authorizationManagementClient = new AuthorizationManagementClient(credential, subscriptionId);
            const roleAssignmentHelper = new RoleAssignmentHelper(authorizationManagementClient);
            
            const newRoleAssignments = new Array<RoleAssignment>();
            const newRoleAssignmentsFailed = new Array<RbacDefinitionEx>();
            const roleAssignmentsMissingRbac = roleAssignments.filter(p => p.roleAssignmentStatus === 'missing-rbac');
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

            const deletedRoleAssignments = new Array<RoleAssignment>();
            const deletedRoleAssignmentsFailed = new Array<RbacDefinitionEx>();
            const roleAssignmentsUnexpectedRbac = roleAssignments.filter(p => p.roleAssignmentStatus === 'unexpected-rbac');
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

            return {newRoleAssignments, newRoleAssignmentsFailed, deletedRoleAssignments, deletedRoleAssignmentsFailed};
        })
        .then(p => {
            const endDate = new Date();

            const durationInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;

            console.log(
                JSON.stringify(
                    {
                        durationInSeconds,
                        newRoleAssignmentsFailed    : p.newRoleAssignmentsFailed,
                        newRoleAssignments          : p.newRoleAssignments,
                        deletedRoleAssignments      : p.deletedRoleAssignments,
                        deletedRoleAssignmentsFailed: p.deletedRoleAssignmentsFailed
                    }, 
                    null, 
                    2
                )
            );
        })
        .catch(p => console.error(p));
    }
}