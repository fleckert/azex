import { AzureRoleAssignmentsConverter   } from "../AzureRoleAssignmentsConverter";
import { AzureRoleAssignmentsSorter      } from "../AzureRoleAssignmentsSorter";
import { AzureRoleAssignmentsToMarkdown2 } from "../AzureRoleAssignmentsToMarkdown2";
import { AzureRoleAssignmentsVerifier    } from "../AzureRoleAssignmentsVerifier";
import { DefaultAzureCredential          } from "@azure/identity";
import { readFile, writeFile             } from "fs/promises";
import { RbacDefinition } from "../models/RbacDefinition";

export class rbac_verify {
    static async handle(subscriptionId: string, pathIn: string, pathOut:string) {
        const startDate = new Date();

        readFile(pathIn)
        .then(p => JSON.parse(p.toString()) as RbacDefinition[])
        .then(p => {
            return new AzureRoleAssignmentsVerifier().verify(new DefaultAzureCredential(), subscriptionId, p);
        }
        )
        .then(p => {
            p.sort(AzureRoleAssignmentsSorter.sort);
            return p;
        })
        .then(async p => {
            await writeFile(`${pathOut}-${subscriptionId}.full.json`, JSON.stringify(p, null, 2));
            return p;
        })
        .then(async p => {
            const collection = new AzureRoleAssignmentsConverter().mapMinimalEx(p);
            await writeFile(`${pathOut}-${subscriptionId}.min.json`, JSON.stringify(collection, null, 2));
            return p;
        })
        .then(async p => {
            const collection = new AzureRoleAssignmentsConverter().mapExtendendEx(p);
            await writeFile(`${pathOut}-${subscriptionId}.ext.json`, JSON.stringify(collection, null, 2));
            return p;
        })
        .then(p => {
            const markDown = new AzureRoleAssignmentsToMarkdown2().convertEx(p);
            writeFile(`${pathOut}-${subscriptionId}.md`, markDown)

            return p;
        })
        .then(p => {
            const endDate = new Date();

            const durationInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;

            console.log({
                files: [
                    `${pathOut}-${subscriptionId}.full.json`,
                    `${pathOut}-${subscriptionId}.min.json`,
                    `${pathOut}-${subscriptionId}.ext.json`,
                    `${pathOut}-${subscriptionId}.md`,
                ],
                durationInSeconds,
            });
        })
        .catch(p => console.error(p));
    }
}