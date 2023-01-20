import { AzureRoleAssignmentsExtender         } from "../AzureRoleAssignmentsExtender";
import { TokenCredential                      } from "@azure/identity";
import { RbacDefinition, RbacDefinitionHelper } from "../models/RbacDefinition";
import { readFile, writeFile                  } from "fs/promises";

export class rbac_extend {
    static async handle(credentials: TokenCredential, subscriptionId: string, pathIn: string, pathOut: string): Promise<void> {
        const startDate = new Date();

        try {
            const content = await readFile(pathIn);
            const rbacDefinitions = JSON.parse(content.toString()) as RbacDefinition[];
            const rbacDefinitionsExtended = await new AzureRoleAssignmentsExtender().extend(credentials, subscriptionId, rbacDefinitions);
            rbacDefinitionsExtended.items.sort(RbacDefinitionHelper.sort);

            await writeFile(`${pathOut}-${subscriptionId}.ext.json`, JSON.stringify(rbacDefinitionsExtended.items, null, 2));

            console.log({
                parameters: {
                    subscriptionId,
                    pathIn,
                    pathOut
                },
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000,
                files: [
                    `${pathOut}-${subscriptionId}.ext.json`
                ],
                failedRequests: rbacDefinitionsExtended.failedRequests,
            });
        } catch (e: any) {
            console.error(e);
            throw e;
        }
    }
}