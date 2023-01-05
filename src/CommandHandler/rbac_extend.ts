import { AzureRoleAssignmentsExtender } from "../AzureRoleAssignmentsExtender";
import { DefaultAzureCredential       } from "@azure/identity";
import { RbacDefinition               } from "../models/RbacDefinition";
import { RbacDefinitionSorter         } from "../models/RbacDefinitionSorter";
import { readFile, writeFile          } from "fs/promises";

export class rbac_extend {
    static async handle(subscriptionId: string, pathIn: string, pathOut: string) {
        const startDate = new Date();

        readFile(pathIn)
        .then(p => JSON.parse(p.toString()) as RbacDefinition[])
        .then(p => {
            return new AzureRoleAssignmentsExtender().extend(new DefaultAzureCredential(), subscriptionId, p);
        })
        .then(p => {
            p.sort(RbacDefinitionSorter.sort);
            return p;
        })
        .then(async p => {
            await writeFile(`${pathOut}-${subscriptionId}.ext.json`, JSON.stringify(p, null, 2));
            return p;
        })
        .then(p => {
            const endDate = new Date();

            const durationInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;

            console.log({
                files: [
                    `${pathOut}-${subscriptionId}.ext.json`
                ],
                durationInSeconds,
            });
        })
        .catch(p => console.error(p));
    }
}