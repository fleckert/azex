import { AzureRoleAssignmentsExtender         } from "../AzureRoleAssignmentsExtender";
import { Helper                               } from "../Helper";
import { RbacDefinition, RbacDefinitionHelper } from "../models/RbacDefinition";
import { readFile, writeFile                  } from "fs/promises";
import { TokenCredential                      } from "@azure/identity";

export class rbac_extend {
    static async handle(credentials: TokenCredential, subscriptionId: string, pathIn: string, pathOut: string): Promise<void> {
        const startDate = new Date();

        const content = await readFile(pathIn);
        const rbacDefinitions = JSON.parse(content.toString()) as RbacDefinition[];
        const rbacDefinitionsExtended = await new AzureRoleAssignmentsExtender().extend(credentials, subscriptionId, rbacDefinitions);
        rbacDefinitionsExtended.items.sort(RbacDefinitionHelper.sort);

        await writeFile(`${pathOut}-${subscriptionId}.ext.json`, JSON.stringify(rbacDefinitionsExtended.items, null, 2));

        console.log(JSON.stringify({
            parameters: {
                subscriptionId,
                pathIn,
                pathOut
            },
            durationInSeconds: Helper.durationInSeconds(startDate),
            files: {
                json: `${pathOut}-${subscriptionId}.ext.json`
            },
            failedRequests: rbacDefinitionsExtended.failedRequests,
        }, null, 2));
    }
}