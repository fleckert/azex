import { AzureDevOpsHelper         } from "../AzureDevOpsHelper";
import { AzureDevOpsSecurityTokens } from "../AzureDevOpsSecurityTokens";
import { writeFile                 } from "fs/promises";
import { Markdown                  } from "../Converters/Markdown";
import { Html                      } from "../Converters/Html";

export class devops_permissions_token {
    static async all(tenantId: string, organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
        const response = await AzureDevOpsSecurityTokens.all(azureDevOpsHelper, organization, project);

        const title = `${organization}-${project}-tokens`;
        const valuesMapped = response.map(p => [p.securityNamespace?.displayName ?? '',p.securityNamespace?.namespaceId ?? '', p.id, p.token]);

        await Promise.all([
            writeFile(`${path}-${title}.json`, JSON.stringify(response, null, 2)),
            writeFile(`${path}-${title}.md`  , Markdown.table(title, ['namespace', 'namespaceId', 'id', 'token'], valuesMapped)),
            writeFile(`${path}-${title}.html`, Html    .table(title, ['namespace', 'namespaceId', 'id', 'token'], valuesMapped))
        ]);

        console.log({
            parameters: {
                organization,
                project,
                path
            },
            files: {
                json    : `${path}-${title}.json`,
                markdown: `${path}-${title}.md`,
                html    : `${path}-${title}.html`
            },
            durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
        });
    }

    static async classificationNodes(tenantId: string, organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
        const response = await AzureDevOpsSecurityTokens.classificationNodes(azureDevOpsHelper, organization, project);

        if (response.error !== undefined) {
            throw new Error(`Failed to resolve classificationNodes ${JSON.stringify({ organization, project })}. [${response.error}]`);
        }
        else if (response.value === undefined) {
            throw new Error(`Failed to resolve classificationNodes ${JSON.stringify({ organization, project })}.`);
        }
        else {
            const title = `${organization}-${project}-classificationNodes`;
            const valuesMapped = response.value.map(p => [p.securityNamespace?.displayName ?? '', p.securityNamespace?.namespaceId ?? '', p.id, p.token]);

            await Promise.all([
                writeFile(`${path}-${title}.json`, JSON.stringify(response.value, null, 2)),
                writeFile(`${path}-${title}.md`  , Markdown.table(title, ['namespace', 'namespaceId', 'node', 'token'], valuesMapped)),
                writeFile(`${path}-${title}.html`, Html    .table(title, ['namespace', 'namespaceId', 'node', 'token'], valuesMapped))
            ]);

            console.log({
                parameters: {
                    organization,
                    project,
                    path
                },
                files: {
                    json    : `${path}-${title}.json`,
                    markdown: `${path}-${title}.md`,
                    html    : `${path}-${title}.html`
                },
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
            });
        }
    }

    static async gitRepositories(tenantId: string, organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
        const response = await AzureDevOpsSecurityTokens.gitRepositories(azureDevOpsHelper, organization, project);

        if (response.error !== undefined) {
            throw new Error(`Failed to resolve gitRepositories ${JSON.stringify({ organization, project })}. [${response.error}]`);
        }
        else if (response.value === undefined) {
            throw new Error(`Failed to resolve gitRepositories ${JSON.stringify({ organization, project })}.`);
        }
        else {
            const title = `${organization}-${project}-gitRepositories`;
            const valuesMapped = response.value.map(p => [p.securityNamespace?.displayName ?? '', p.securityNamespace?.namespaceId ?? '', p.id, p.token]);

            await Promise.all([
                writeFile(`${path}-${title}.json`, JSON.stringify(response.value, null, 2)),
                writeFile(`${path}-${title}.md`  , Markdown.table(title, ['namespace', 'namespaceId', 'repository', 'token'], valuesMapped)),
                writeFile(`${path}-${title}.html`, Html    .table(title, ['namespace', 'namespaceId', 'repository', 'token'], valuesMapped))
            ]);

            console.log({
                parameters: {
                    organization,
                    project,
                    path
                },
                files: {
                    json    : `${path}-${title}.json`,
                    markdown: `${path}-${title}.md`,
                    html    : `${path}-${title}.html`
                },
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
            });
        }
    }

    static async projects(tenantId: string, organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
        const response = await AzureDevOpsSecurityTokens.project(azureDevOpsHelper, organization, project);

        if (response.error !== undefined) {
            throw new Error(`Failed to resolve projects ${JSON.stringify({ organization })}. [${response.error}]`);
        }
        else if (response.value === undefined) {
            throw new Error(`Failed to resolve projects ${JSON.stringify({ organization })}.`);
        }
        else {
            const title = `${organization}-projects`;
            const valuesMapped = response.value.map(p => [p.securityNamespace?.displayName ?? '', p.securityNamespace?.namespaceId ?? '', p.id, p.token]);

            await Promise.all([
                writeFile(`${path}-${title}.json`, JSON.stringify(response.value, null, 2)),
                writeFile(`${path}-${title}.md`  , Markdown.table(title, ['namespace', 'namespaceId', 'project', 'token'], valuesMapped)),
                writeFile(`${path}-${title}.html`, Html    .table(title, ['namespace', 'namespaceId', 'project', 'token'], valuesMapped))
            ]);

            console.log({
                parameters: {
                    organization,
                    path
                },
                files: {
                    json    : `${path}-${title}.json`,
                    markdown: `${path}-${title}.md`,
                    html    : `${path}-${title}.html`
                },
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
            });
        }
    }

    static async tagging(tenantId: string, organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
        const response = await AzureDevOpsSecurityTokens.tagging(azureDevOpsHelper, organization, project);

        if (response.error !== undefined) {
            throw new Error(`Failed to resolve projects ${JSON.stringify({ organization })}. [${response.error}]`);
        }
        else if (response.value === undefined) {
            throw new Error(`Failed to resolve projects ${JSON.stringify({ organization })}.`);
        }
        else {
            const title = `${organization}-tagging`;
            const valuesMapped = response.value.map(p => [p.securityNamespace?.displayName ?? '', p.securityNamespace?.namespaceId ?? '', p.id, p.token]);

            await Promise.all([
                writeFile(`${path}-${title}.json`, JSON.stringify(response.value, null, 2)),
                writeFile(`${path}-${title}.md`  , Markdown.table(title, ['namespace', 'namespaceId', 'project', 'token'], valuesMapped)),
                writeFile(`${path}-${title}.html`, Html    .table(title, ['namespace', 'namespaceId', 'project', 'token'], valuesMapped))
            ]);

            console.log({
                parameters: {
                    organization,
                    path
                },
                files: {
                    json    : `${path}-${title}.json`,
                    markdown: `${path}-${title}.md`,
                    html    : `${path}-${title}.html`
                },
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
            });
        }
    }

    static async buildDefinitions(tenantId: string, organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
        const response = await AzureDevOpsSecurityTokens.buildDefinitions(azureDevOpsHelper, organization, project);

        if (response.error !== undefined) {
            throw new Error(`Failed to resolve buildDefinitions ${JSON.stringify({ organization, project })}. [${response.error}]`);
        }
        else if (response.value === undefined) {
            throw new Error(`Failed to resolve buildDefinitions ${JSON.stringify({ organization, project })}.`);
        }
        else {
            const title = `${organization}-buildDefinitions`;
            const valuesMapped = response.value.map(p => [p.securityNamespace?.displayName ?? '', p.securityNamespace?.namespaceId ?? '', p.id, p.token]);

            await Promise.all([
                writeFile(`${path}-${title}.json`, JSON.stringify(response.value, null, 2)),
                writeFile(`${path}-${title}.md`  , Markdown.table(title, ['namespace', 'namespaceId', 'buildDefinition', 'token'], valuesMapped)),
                writeFile(`${path}-${title}.html`, Html    .table(title, ['namespace', 'namespaceId', 'buildDefinition', 'token'], valuesMapped))
            ]);

            console.log({
                parameters: {
                    organization,
                    project,
                    path
                },
                files: {
                    json    : `${path}-${title}.json`,
                    markdown: `${path}-${title}.md`,
                    html    : `${path}-${title}.html`
                },
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
            });
        }
    }

    static async releaseDefinitions(tenantId: string, organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
        const response = await AzureDevOpsSecurityTokens.releaseDefinitions(azureDevOpsHelper, organization, project);

        if (response.error !== undefined) {
            throw new Error(`Failed to resolve releaseDefinitions ${JSON.stringify({ organization, project })}. [${response.error}]`);
        }
        else if (response.value === undefined) {
            throw new Error(`Failed to resolve releaseDefinitions ${JSON.stringify({ organization, project })}.`);
        }
        else {
            const title = `${organization}-releaseDefinitions`;
            const valuesMapped = response.value.map(p => [p.securityNamespace?.displayName ?? '', p.securityNamespace?.namespaceId ?? '', p.id, p.token]);

            await Promise.all([
                writeFile(`${path}-${title}.json`, JSON.stringify(response.value, null, 2)),
                writeFile(`${path}-${title}.md`  , Markdown.table(title, ['namespace', 'namespaceId', 'releaseDefinition', 'token'], valuesMapped)),
                writeFile(`${path}-${title}.html`, Html    .table(title, ['namespace', 'namespaceId', 'releaseDefinition', 'token'], valuesMapped))
            ]);

            console.log({
                parameters: {
                    organization,
                    project,
                    path
                },
                files: {
                    json    : `${path}-${title}.json`,
                    markdown: `${path}-${title}.md`,
                    html    : `${path}-${title}.html`
                },
                durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000
            });
        }
    }
}
