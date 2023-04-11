import { AzureDevOpsHelper                                          } from "../AzureDevOpsHelper";
import { AzureDevOpsSecurityTokenElement, AzureDevOpsSecurityTokens } from "../AzureDevOpsSecurityTokens";
import { Helper                                                     } from "../Helper";
import { Html                                                       } from "../Converters/Html";
import { Markdown                                                   } from "../Converters/Markdown";
import { writeFile                                                  } from "fs/promises";

export class devops_permissions_token {
    static async all                 (tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.all                 , 'tokens'               ); }
    static async auditLog            (tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.auditLog            , 'auditLog'             ); }
    static async analytics           (tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.analytics           , 'analytics'            ); }
    static async analyticsViews      (tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.analyticsViews      , 'analyticsViews'       ); }
    static async buildDefinitions    (tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.buildDefinitions    , 'buildDefinitions'     ); }
    static async identity            (tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.identity            , 'identity'             ); }
    static async classificationNodes (tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.classificationNodes , 'classificationNodes'  ); }
    static async dashboardsPrivileges(tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.dashboardsPrivileges, 'dashboardsPrivileges' ); }
    static async environment         (tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.environment         , 'environment'          ); }
    static async gitRepositories     (tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.gitRepositories     , 'gitRepositories'      ); }
    static async library             (tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.library             , 'library'              ); }
    static async plan                (tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.plan                , 'plan'                 ); }
    static async project             (tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.project             , 'project'              ); }
    static async process             (tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.process             , 'process'              ); }
    static async releaseManagement   (tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.releaseManagement   , 'releaseManagement'    ); }
    static async tagging             (tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.tagging             , 'tagging'              ); }
    static async workItemQueryFolders(tenant: string, organization: string, project: string, path: string): Promise<void> { return devops_permissions_token.run(tenant, organization, project, path, AzureDevOpsSecurityTokens.workItemQueryFolders, 'workItemQueryFolders' ); }

    private static async run(
        tenant      : string,
        organization: string,
        project     : string,
        path        : string,
        func        : (azureDevOpsHelper: AzureDevOpsHelper, organization: string, project: string) => Promise<Array<AzureDevOpsSecurityTokenElement>>,
        titleSuffix : string
    ) : Promise<void> {
        const startDate = new Date();

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);
        const response = await func(azureDevOpsHelper, organization, project);

        response.sort((a, b) => {
            const map = (value: AzureDevOpsSecurityTokenElement): string => { return `${value.securityNamespace.name}-${value.id}`.toLowerCase(); }

            return map(a).localeCompare(map(b));
        });

        const title = `${organization}-${project}-${titleSuffix}`;
        const valuesMapped = response.map(p => [p.securityNamespace?.name ?? '',p.securityNamespace?.namespaceId ?? '', p.id, p.token]);

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
}
