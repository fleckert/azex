import { AzureRoleAssignmentsExtender         } from "../AzureRoleAssignmentsExtender";
import { TokenCredential                      } from "@azure/identity";
import { RbacDefinition, RbacDefinitionHelper } from "../models/RbacDefinition";
import { readFile, writeFile                  } from "fs/promises";

export class rbac_extend {
    static handle(credential: TokenCredential, subscriptionId: string, pathIn: string, pathOut: string) : Promise<void> {
        const startDate = new Date();

        return readFile(pathIn)
        .then(p => JSON.parse(p.toString()) as RbacDefinition[])
        .then(p => {
            return new AzureRoleAssignmentsExtender().extend(credential, subscriptionId, p);
        })
        .then(p => {
            p.items.sort(RbacDefinitionHelper.sort);
            return p;
        })
        .then(async p => {
            await writeFile(`${pathOut}-${subscriptionId}.ext.json`, JSON.stringify(p.items, null, 2));
            return p;
        })
        .then(p => {
            const endDate = new Date();

            const durationInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;

            console.log({
                parameters:{
                    subscriptionId,
                    pathIn,
                    pathOut
                },
                durationInSeconds,
                files: [
                    `${pathOut}-${subscriptionId}.ext.json`
                ],
                failedRequests: p.failedRequests,
            });
        })
        .catch(p => console.error(p));
    }
}