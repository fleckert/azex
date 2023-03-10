import { AzureDevOpsHelper         } from "../AzureDevOpsHelper";
import { AzureDevOpsSecurityTokens } from "../AzureDevOpsSecurityTokens";
import { Helper                    } from "../Helper";
import { Html                      } from "../Converters/Html";
import { Markdown                  } from "../Converters/Markdown";
import { writeFile                 } from "fs/promises";

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

        console.log(JSON.stringify({
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
            durationInSeconds: Helper.durationInSeconds(startDate)
        }, null, 2));
    }

    static async classificationNodes(tenantId: string, organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
        const response = await AzureDevOpsSecurityTokens.classificationNodes(azureDevOpsHelper, organization, project);

        const title = `${organization}-${project}-classificationNodes`;
        const valuesMapped = response.map(p => [p.securityNamespace?.displayName ?? '', p.securityNamespace?.namespaceId ?? '', p.id, p.token]);

        await Promise.all([
            writeFile(`${path}-${title}.json`, JSON.stringify(response, null, 2)),
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
            durationInSeconds: Helper.durationInSeconds(startDate)
        });
    }

    static async gitRepositories(tenantId: string, organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
        const response = await AzureDevOpsSecurityTokens.gitRepositories(azureDevOpsHelper, organization, project);

        const title = `${organization}-${project}-gitRepositories`;
        const valuesMapped = response.map(p => [p.securityNamespace?.displayName ?? '', p.securityNamespace?.namespaceId ?? '', p.id, p.token]);

        await Promise.all([
            writeFile(`${path}-${title}.json`, JSON.stringify(response, null, 2)),
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
            durationInSeconds: Helper.durationInSeconds(startDate)
        });
    }

    static async projects(tenantId: string, organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
        const response = await AzureDevOpsSecurityTokens.project(azureDevOpsHelper, organization, project);

        const title = `${organization}-projects`;
        const valuesMapped = response.map(p => [p.securityNamespace?.displayName ?? '', p.securityNamespace?.namespaceId ?? '', p.id, p.token]);

        await Promise.all([
            writeFile(`${path}-${title}.json`, JSON.stringify(response, null, 2)),
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
            durationInSeconds: Helper.durationInSeconds(startDate)
        });
    }

    static async tagging(tenantId: string, organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
        const response = await AzureDevOpsSecurityTokens.tagging(azureDevOpsHelper, organization, project);

        const title = `${organization}-tagging`;
        const valuesMapped = response.map(p => [p.securityNamespace?.displayName ?? '', p.securityNamespace?.namespaceId ?? '', p.id, p.token]);

        await Promise.all([
            writeFile(`${path}-${title}.json`, JSON.stringify(response, null, 2)),
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
            durationInSeconds: Helper.durationInSeconds(startDate)
        });
    }

    static async buildDefinitions(tenantId: string, organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
        const response = await AzureDevOpsSecurityTokens.buildDefinitions(azureDevOpsHelper, organization, project);

        const title = `${organization}-buildDefinitions`;
        const valuesMapped = response.map(p => [p.securityNamespace?.displayName ?? '', p.securityNamespace?.namespaceId ?? '', p.id, p.token]);

        await Promise.all([
            writeFile(`${path}-${title}.json`, JSON.stringify(response, null, 2)),
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
            durationInSeconds: Helper.durationInSeconds(startDate)
        });
    }

    static async releaseDefinitions(tenantId: string, organization: string, project: string, path: string): Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
        const response = await AzureDevOpsSecurityTokens.releaseDefinitions(azureDevOpsHelper, organization, project);

        const title = `${organization}-releaseDefinitions`;
        const valuesMapped = response.map(p => [p.securityNamespace?.displayName ?? '', p.securityNamespace?.namespaceId ?? '', p.id, p.token]);

        await Promise.all([
            writeFile(`${path}-${title}.json`, JSON.stringify(response, null, 2)),
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
            durationInSeconds: Helper.durationInSeconds(startDate)
        });
    }
}
