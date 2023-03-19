import { AzureDevOpsAuditLogEntry } from "../models/AzureDevOpsAuditLogEntry";
import { AzureDevOpsHelper        } from "../AzureDevOpsHelper";
import { Helper                   } from "../Helper";
import { Html                     } from "../Converters/Html";
import { Markdown                 } from "../Converters/Markdown";
import { writeFile                } from "fs/promises";

export class devops_auditlog_query {
    static async handle(tenant: string, organization: string, path: string): Promise<void> {
        const startDate = new Date();
        
        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);
        
        const startTime = undefined;
        const endTime   = undefined;
        const count     = undefined;

        const auditLogEntries = await azureDevOpsHelper.auditLog(organization, startTime, endTime, count);

        const title = `${organization}-auditlog`;

        const timeStampMarkdown = (organization: string, value: string | undefined, offsetInSeconds: number): string => {
            if (value === undefined) { return ''; }

            const date = Date.parse(value);

            if (Number.isNaN(date)) { return value; }

            const startTime = new Date(date - offsetInSeconds * 1000).toISOString();
            const endTime   = new Date(date + offsetInSeconds * 1000).toISOString();

            const url = Markdown.getLinkWithToolTip(timeStampDisplay(value), auditLogUrl(organization, startTime, endTime), value);

            return url;
        };

        const timeStampHtml = (organization: string, value: string | undefined, offsetInSeconds: number): string => {
            if (value === undefined) { return ''; }

            const date = Date.parse(value);

            if (Number.isNaN(date)) { return value; }

            const startTime = new Date(date - offsetInSeconds * 1000).toISOString();
            const endTime   = new Date(date + offsetInSeconds * 1000).toISOString();

            const url = Html.getLinkWithToolTip(timeStampDisplay(value), auditLogUrl(organization, startTime, endTime), value);

            return `<pre>${url}</pre>`;
        };

        const timeStampDisplay = (value: string) => {
            const valueStripped = value.substring(0, value.indexOf('.') > 0 ? value.indexOf('.') : undefined) + 'Z';

            return valueStripped;//`${new Date(value).toDateString()} ${new Date(value).toLocaleTimeString()}`;
        }

        const auditLogUrl = (organization: string, startTime: string, endTime: string) => { return `https://auditservice.dev.azure.com/${organization}/_apis/audit/auditlog?startTime=${startTime}&endTime=${endTime}` };

        const actorMarkdown = (p: AzureDevOpsAuditLogEntry): string => { return Markdown.getLinkWithToolTip(`${p.actorDisplayName}`, `${p.actorUPN}`, `${p.actorUPN}`) };
        const actorHtml     = (p: AzureDevOpsAuditLogEntry): string => { return Html    .getLinkWithToolTip(`${p.actorDisplayName}`, `${p.actorUPN}`, `${p.actorUPN}`) };

        const offsetInSeconds = 0.001;

        const valuesMappedMarkdown = auditLogEntries.map(p => [
            timeStampMarkdown(organization, p.timestamp, offsetInSeconds),
            p.scopeDisplayName ?? '',
            p.projectName ?? '',
            p.actionId ?? '',
            actorMarkdown(p),
            p.details ?? ''
        ]);
        const valuesMappedHtml = auditLogEntries.map(p => [
            timeStampHtml(organization, p.timestamp, offsetInSeconds),
            p.scopeDisplayName ?? '',
            p.projectName ?? '',
            p.actionId ?? '',
            actorHtml(p),
            p.details ?? ''
        ]);
        const headers = ['timestamp', 'scope', 'project', 'action', 'actor', 'details'];

        await Promise.all([
            writeFile(`${path}-${title}.json`, JSON.stringify(auditLogEntries, null, 2)),
            writeFile(`${path}-${title}.md`  , Markdown.table(title, headers, valuesMappedMarkdown)),
            writeFile(`${path}-${title}.html`, Html.tableWithSorting(title, headers, valuesMappedHtml))
        ]);

        console.log(JSON.stringify({
            tenant,
            organization,
            startTime,
            endTime,
            files: {
                json    : `${path}-${title}.json`,
                markdown: `${path}-${title}.md`,
                html    : `${path}-${title}.html`
            },
            durationInSeconds: Helper.durationInSeconds(startDate)
        }, null, 2));
    }
}
