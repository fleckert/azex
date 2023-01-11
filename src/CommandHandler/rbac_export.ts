import { AzureRoleAssignmentsConverter   } from "../AzureRoleAssignmentsConverter";
import { AzureRoleAssignmentsResolver    } from "../AzureRoleAssignmentsResolver";
import { AzureRoleAssignmentsSorter      } from "../AzureRoleAssignmentsSorter";
import { AzureRoleAssignmentsToMarkdown2 } from "../AzureRoleAssignmentsToMarkdown2";
import { TokenCredential                 } from "@azure/identity";
import { writeFile                       } from "fs/promises";

export class rbac_export {
    static async handle(credential: TokenCredential, subscriptionId: string, path: string) {
        const startDate = new Date();

        new AzureRoleAssignmentsResolver()
        .resolve(credential, subscriptionId)
        .then(p => {
            p.roleAssignments.sort(AzureRoleAssignmentsSorter.sort);
            return p;
        })
        .then(async p => {
            await writeFile(`${path}-${subscriptionId}.full.json`, JSON.stringify(p, null, 2));
            return p;
        })
        .then(async p => {
            const collection = new AzureRoleAssignmentsConverter().mapMinimal(p.roleAssignments);
            await writeFile(`${path}-${subscriptionId}.min.json`, JSON.stringify(collection, null, 2));
            return p;
        })
        .then(async p => {
            const collection = new AzureRoleAssignmentsConverter().mapExtendend(p.roleAssignments);
            await writeFile(`${path}-${subscriptionId}.ext.json`, JSON.stringify(collection, null, 2));
            return p;
        })
        .then(async p => {
            const collection = new AzureRoleAssignmentsConverter().mapMinimalNoIds(p.roleAssignments);
            await writeFile(`${path}-${subscriptionId}.names.json`, JSON.stringify(collection, null, 2));
            return p;
        })
        .then(p => {
            const markDown = new AzureRoleAssignmentsToMarkdown2().convert(p.roleAssignments);
            writeFile(`${path}-${subscriptionId}.md`, markDown)
            return p;
        })
        .then(p => {
            const endDate = new Date();

            const durationInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;

            console.log({
                parameters:{
                    subscriptionId,
                    path
                },
                durationInSeconds,
                files: [
                    `${path}-${subscriptionId}.full.json`,
                    `${path}-${subscriptionId}.min.json`,
                    `${path}-${subscriptionId}.ext.json`,
                    `${path}-${subscriptionId}.names.json`,
                    `${path}-${subscriptionId}.md`,
                ],
                failedRequests: p.failedRequests,
            });
        })
        .catch(p => console.error(p));
    }
}