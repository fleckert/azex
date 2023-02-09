import { AzureDevOpsHelper         } from "../AzureDevOpsHelper";
import { AzureDevOpsSecurityTokens } from "../AzureDevOpsSecurityTokens";
import { writeFile                 } from "fs/promises";
import { Markdown                  } from "../Converters/Markdown";
import { Html                      } from "../Converters/Html";

export class devops_permissions_token {
    static async all(organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = new AzureDevOpsHelper();
        const response = await AzureDevOpsSecurityTokens.all(azureDevOpsHelper, organization, project);

        const title = `${organization}-${project}-tokens`;
        const valuesMapped =response.map(p => [p.id, p.token]);

        await Promise.all([
            writeFile(`${path}-${title}.json`, JSON.stringify(response, null, 2)),
            writeFile(`${path}-${title}.md`  , Markdown.table(title, ['id', 'token'], valuesMapped)),
            writeFile(`${path}-${title}.html`, Html    .table(title, ['id', 'token'], valuesMapped))
        ]);

        console.log({
            parameters: {
                organization,
                project,
                path
            },
            files: [
                `${path}-${title}.json`,
                `${path}-${title}.md`,
                `${path}-${title}.html`
            ],
            durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
        });
    }

    static async classificationNodes(organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = new AzureDevOpsHelper();
        const response = await AzureDevOpsSecurityTokens.classificationNodes(azureDevOpsHelper, organization, project);

        if (response.error !== undefined) {
            throw new Error(`Failed to resolve classificationNodes ${JSON.stringify({ organization, project })}. [${response.error}]`);
        }
        else if (response.value === undefined) {
            throw new Error(`Failed to resolve classificationNodes ${JSON.stringify({ organization, project })}.`);
        }
        else {
            const title = `${organization}-${project}-classificationNodes`;
            const valuesMapped =response.value.map(p => [p.path, p.token]);

            await Promise.all([
                writeFile(`${path}-${title}.json`, JSON.stringify(response.value, null, 2)),
                writeFile(`${path}-${title}.md`  , Markdown.table(title, ['node', 'token'], valuesMapped)),
                writeFile(`${path}-${title}.html`, Html    .table(title, ['node', 'token'], valuesMapped))
            ]);

            console.log({
                parameters: {
                    organization,
                    project,
                    path
                },
                files: [
                    `${path}-${title}.json`,
                    `${path}-${title}.md`,
                    `${path}-${title}.html`
                ],
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
            });
        }
    }

    static async gitRepositories(organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = new AzureDevOpsHelper();
        const response = await AzureDevOpsSecurityTokens.gitRepositories(azureDevOpsHelper, organization, project);

        if (response.error !== undefined) {
            throw new Error(`Failed to resolve gitRepositories ${JSON.stringify({ organization, project })}. [${response.error}]`);
        }
        else if (response.value === undefined) {
            throw new Error(`Failed to resolve gitRepositories ${JSON.stringify({ organization, project })}.`);
        }
        else {
            const title = `${organization}-${project}-gitRepositories`;
            const valuesMapped = response.value.map(p => [p.repository, p.token]);

            await Promise.all([
                writeFile(`${path}-${title}.json`, JSON.stringify(response.value, null, 2)),
                writeFile(`${path}-${title}.md`  , Markdown.table(title, ['repository', 'token'], valuesMapped)),
                writeFile(`${path}-${title}.html`, Html    .table(title, ['repository', 'token'], valuesMapped))
            ]);

            console.log({
                parameters: {
                    organization,
                    project,
                    path
                },
                files: [
                    `${path}-${title}.json`,
                    `${path}-${title}.md`,
                    `${path}-${title}.html`
                ],
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
            });
        }
    }

    static async projects(organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = new AzureDevOpsHelper();
        const response = await AzureDevOpsSecurityTokens.project(azureDevOpsHelper, organization, project);

        if (response.error !== undefined) {
            throw new Error(`Failed to resolve projects ${JSON.stringify({ organization })}. [${response.error}]`);
        }
        else if (response.value === undefined) {
            throw new Error(`Failed to resolve projects ${JSON.stringify({ organization })}.`);
        }
        else {
            const title = `${organization}-projects`;
            const valuesMapped = response.value.map(p => [p.project, p.token]);

            await Promise.all([
                writeFile(`${path}-${title}.json`, JSON.stringify(response.value, null, 2)),
                writeFile(`${path}-${title}.md`  , Markdown.table(title, ['project', 'token'], valuesMapped)),
                writeFile(`${path}-${title}.html`, Html    .table(title, ['project', 'token'], valuesMapped))
            ]);

            console.log({
                parameters: {
                    organization,
                    path
                },
                files: [
                    `${path}-${title}.json`,
                    `${path}-${title}.md`,
                    `${path}-${title}.html`
                ],
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
            });
        }
    }

    static async tagging(organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = new AzureDevOpsHelper();
        const response = await AzureDevOpsSecurityTokens.tagging(azureDevOpsHelper, organization, project);

        if (response.error !== undefined) {
            throw new Error(`Failed to resolve projects ${JSON.stringify({ organization })}. [${response.error}]`);
        }
        else if (response.value === undefined) {
            throw new Error(`Failed to resolve projects ${JSON.stringify({ organization })}.`);
        }
        else {
            const title = `${organization}-tagging`;
            const valuesMapped = response.value.map(p => [p.project, p.token]);

            await Promise.all([
                writeFile(`${path}-${title}.json`, JSON.stringify(response.value, null, 2)),
                writeFile(`${path}-${title}.md`  , Markdown.table(title, ['project', 'token'], valuesMapped)),
                writeFile(`${path}-${title}.html`, Html    .table(title, ['project', 'token'], valuesMapped))
            ]);

            console.log({
                parameters: {
                    organization,
                    path
                },
                files: [
                    `${path}-${title}.json`,
                    `${path}-${title}.md`,
                    `${path}-${title}.html`
                ],
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
            });
        }
    }

    static async buildDefinitions(organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = new AzureDevOpsHelper();
        const response = await AzureDevOpsSecurityTokens.buildDefinitions(azureDevOpsHelper, organization, project);

        if (response.error !== undefined) {
            throw new Error(`Failed to resolve buildDefinitions ${JSON.stringify({ organization, project })}. [${response.error}]`);
        }
        else if (response.value === undefined) {
            throw new Error(`Failed to resolve buildDefinitions ${JSON.stringify({ organization, project })}.`);
        }
        else {
            const title = `${organization}-buildDefinitions`;
            const valuesMapped = response.value.map(p => [p.buildDefinition, p.token]);

            await Promise.all([
                writeFile(`${path}-${title}.json`, JSON.stringify(response.value, null, 2)),
                writeFile(`${path}-${title}.md`  , Markdown.table(title, ['buildDefinition', 'token'], valuesMapped)),
                writeFile(`${path}-${title}.html`, Html    .table(title, ['buildDefinition', 'token'], valuesMapped))
            ]);

            console.log({
                parameters: {
                    organization,
                    project,
                    path
                },
                files: [
                    `${path}-${title}.json`,
                    `${path}-${title}.md`,
                    `${path}-${title}.html`
                ],
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
            });
        }
    }

    static async releaseDefinitions(organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = new AzureDevOpsHelper();
        const response = await AzureDevOpsSecurityTokens.releaseDefinitions(azureDevOpsHelper, organization, project);

        if (response.error !== undefined) {
            throw new Error(`Failed to resolve releaseDefinitions ${JSON.stringify({ organization, project })}. [${response.error}]`);
        }
        else if (response.value === undefined) {
            throw new Error(`Failed to resolve releaseDefinitions ${JSON.stringify({ organization, project })}.`);
        }
        else {
            const title = `${organization}-releaseDefinitions`;
            const valuesMapped = response.value.map(p => [p.releaseDefinition, p.token]);

            await Promise.all([
                writeFile(`${path}-${title}.json`, JSON.stringify(response.value, null, 2)),
                writeFile(`${path}-${title}.md`  , Markdown.table(title, ['releaseDefinition', 'token'], valuesMapped)),
                writeFile(`${path}-${title}.html`, Html    .table(title, ['releaseDefinition', 'token'], valuesMapped))
            ]);

            console.log({
                parameters: {
                    organization,
                    project,
                    path
                },
                files: [
                    `${path}-${title}.json`,
                    `${path}-${title}.md`,
                    `${path}-${title}.html`
                ],
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
            });
        }
    }
}
