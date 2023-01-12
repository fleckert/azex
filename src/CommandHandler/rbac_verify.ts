import { AzureRoleAssignmentsConverter  } from "../AzureRoleAssignmentsConverter";
import { AzureRoleAssignmentsToHtml     } from "../Converters/AzureRoleAssignmentsToHtml";
import { AzureRoleAssignmentsToMarkdown } from "../Converters/AzureRoleAssignmentsToMarkdown";
import { AzureRoleAssignmentsVerifier   } from "../AzureRoleAssignmentsVerifier";
import { RbacDefinition                 } from "../models/RbacDefinition";
import { readFile, writeFile            } from "fs/promises";
import { TokenCredential                } from "@azure/identity";
import { AzureRoleAssignmentHelper      } from "../models/AzureRoleAssignment";

export class rbac_verify {
    static async handle(credential: TokenCredential, subscriptionId: string, pathIn: string, pathOut: string) {
        const startDate = new Date();

        readFile(pathIn)
        .then(p => JSON.parse(p.toString()) as RbacDefinition[])
        .then(p => {
            return new AzureRoleAssignmentsVerifier().verify(credential, subscriptionId, p);
        }
        )
        .then(p => {
            p.sort(AzureRoleAssignmentHelper.sort);
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
        .then(async p => {
            const content = new AzureRoleAssignmentsToMarkdown().convertEx(p);
            await writeFile(`${pathOut}-${subscriptionId}.md`, content);
            return p;
        })
        .then(async p => {
            const content = new AzureRoleAssignmentsToHtml().convertEx(p);
            await writeFile(`${pathOut}-${subscriptionId}.html`, content);
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
                files: [
                    `${pathOut}-${subscriptionId}.full.json`,
                    `${pathOut}-${subscriptionId}.min.json`,
                    `${pathOut}-${subscriptionId}.ext.json`,
                    `${pathOut}-${subscriptionId}.md`,
                    `${pathOut}-${subscriptionId}.html`,
                ],
                durationInSeconds,
            });
        })
        .catch(p => console.error(p));
    }
}