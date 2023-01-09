import { AzureRoleAssignmentsConverter   } from "../AzureRoleAssignmentsConverter";
import { AzureRoleAssignmentsResolver    } from "../AzureRoleAssignmentsResolver";
import { AzureRoleAssignmentsSorter      } from "../AzureRoleAssignmentsSorter";
import { AzureRoleAssignmentsToMarkdown2 } from "../AzureRoleAssignmentsToMarkdown2";
import { DefaultAzureCredential          } from "@azure/identity";
import { writeFile                       } from "fs/promises";

export class rbac_export {
    static async handle(subscriptionId: string, pathForFiles: string) {
        const startDate = new Date();

        new AzureRoleAssignmentsResolver()
        .resolve(new DefaultAzureCredential(), subscriptionId)
        .then(p => {
            p.roleAssignments.sort(AzureRoleAssignmentsSorter.sort);
            return p;
        })
        .then(async p => {
            await writeFile(`${pathForFiles}-${subscriptionId}.full.json`, JSON.stringify(p, null, 2));
            return p;
        })
        .then(async p => {
            const collection = new AzureRoleAssignmentsConverter().mapMinimal(p.roleAssignments);
            await writeFile(`${pathForFiles}-${subscriptionId}.min.json`, JSON.stringify(collection, null, 2));
            return p;
        })
        .then(async p => {
            const collection = new AzureRoleAssignmentsConverter().mapExtendend(p.roleAssignments);
            await writeFile(`${pathForFiles}-${subscriptionId}.ext.json`, JSON.stringify(collection, null, 2));
            return p;
        })
        .then(async p => {
            const collection = new AzureRoleAssignmentsConverter().mapMinimalNoIds(p.roleAssignments);
            await writeFile(`${pathForFiles}-${subscriptionId}.names.json`, JSON.stringify(collection, null, 2));
            return p;
        })
        .then(p => {
            const markDown = new AzureRoleAssignmentsToMarkdown2().convert(p.roleAssignments);
            writeFile(`${pathForFiles}-${subscriptionId}.md`, markDown)
            return p;
        })
        .then(p => {
            const endDate = new Date();

            const durationInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;

            console.log({
                files: [
                    `${pathForFiles}-${subscriptionId}.full.json`,
                    `${pathForFiles}-${subscriptionId}.min.json`,
                    `${pathForFiles}-${subscriptionId}.ext.json`,
                    `${pathForFiles}-${subscriptionId}.names.json`,
                    `${pathForFiles}-${subscriptionId}.md`,
                ],
                failedRequests: p.failedRequests,
                durationInSeconds,
            });
        })
        .catch(p => console.error(p));
    }
}