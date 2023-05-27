import { AzureDevOpsAuditLogEntry, 
         AzureDevOpsAuditLogEntryActionIds, 
         AzureDevOpsAuditLogEntry_Data_ExtensionInstalled, 
         AzureDevOpsAuditLogEntry_Data_ExtensionVersionUpdated, 
         AzureDevOpsAuditLogEntry_Data_GroupCreateGroups, 
         AzureDevOpsAuditLogEntry_Data_GroupUpdateGroupMembership,
         AzureDevOpsAuditLogEntry_Data_GroupUpdateGroupsModify,
         AzureDevOpsAuditLogEntry_Data_Licensing,
         AzureDevOpsAuditLogEntry_Data_LicensingModified,
         AzureDevOpsAuditLogEntry_Data_PolicyPolicyConfigModified,
         AzureDevOpsAuditLogEntry_Data_PolicyPolicyConfigRemoved,
         AzureDevOpsAuditLogEntry_Data_ProjectArea,
         AzureDevOpsAuditLogEntry_Data_ProjectIteration,
         AzureDevOpsAuditLogEntry_Data_ProjectProcessModify,
         AzureDevOpsAuditLogEntry_Data_SecurityModifyAccessControlLists,
         AzureDevOpsAuditLogEntry_Data_SecurityModifyPermission,
         AzureDevOpsAuditLogEntry_Data_SecurityRemoveAccessControlLists, 
         AzureDevOpsAuditLogEntry_Data_SecurityRemovePermission, 
         AzureDevOpsAuditLogEntry_Data_TokenPatCreateEvent,              
         AzureDevOpsAuditLogEntry_Data_TokenPatRevokeEvent              } from "../models/AzureDevOpsAuditLogEntry";
import { az_devops_security_permission                                  } from "../AzureCli/devops/security/permission";
import { AzureDevOpsHelper                                              } from "../AzureDevOpsHelper";
import { AzureDevOpsPortalLinks                                         } from "../AzureDevOpsPortalLinks";
import { AzureDevOpsSecurityTokenElement, AzureDevOpsSecurityTokens     } from "../AzureDevOpsSecurityTokens";
import { AzureDevOpsSecurityTokenParser                                 } from "../AzureDevOpsSecurityTokenParser";
import { GraphMember                                                    } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Helper                                                         } from "../Helper";
import { Html                                                           } from "../Converters/Html";
import { InstalledExtension                                             } from "azure-devops-node-api/interfaces/ExtensionManagementInterfaces";
import { Markdown                                                       } from "../Converters/Markdown";
import { readFile, writeFile                                            } from "fs/promises";
import { TeamProjectReference                                           } from "azure-devops-node-api/interfaces/CoreInterfaces";

export class devops_auditlog_query {
    static async handle(tenant: string, organization: string, count: number, path: string): Promise<void> {
        const startDate = new Date();

        const startTime                 = undefined;
        const endTime                   = undefined;
        const offsetInSeconds           = 0.001;
        const includeDisabledExtensions = true;
        const includeErrors             = true;

        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);

        const securityTokensPromise = devops_auditlog_query.resolveSecurityTokens(azureDevOpsHelper, organization);
        const extensionsPromise     = azureDevOpsHelper.extensions(organization, includeDisabledExtensions, includeErrors);
        const projectsPromise       = azureDevOpsHelper.projects(organization);

        const auditLogEntries: AzureDevOpsAuditLogEntry[] = await azureDevOpsHelper.auditLog(organization, startTime, endTime, count);

        const membersPromise = devops_auditlog_query.resolve_Members(azureDevOpsHelper, organization, auditLogEntries);

        const correlationIdsFiltered = devops_auditlog_query.getCorrelationIds(auditLogEntries);

        const securityTokens = await securityTokensPromise;
        const extensions     = await extensionsPromise;
        const projects       = await projectsPromise;
        const members        = await membersPromise;

        const title = `${organization}-auditlog`;

        if (Helper.isInDebugMode()) {
            const unresolved = [...new Set<string>(
                auditLogEntries.filter(p => p.actionId === 'Security.ModifyPermission')
                    .map   (p => p.data as AzureDevOpsAuditLogEntry_Data_SecurityModifyPermission)
                    .filter(p => p !== undefined)
                    .filter(p => securityTokens.find(m => m.securityNamespace.namespaceId?.toLowerCase() === p.NamespaceId?.toLowerCase() && m.token.toLowerCase() === p.Token?.toLowerCase()) === undefined)
                    .map   (p => { return `${p.NamespaceId} | ${p.NamespaceName} | ${p.Token}` })
            )].sort();

            await writeFile(`${path}-${title}-unresolved.txt` , unresolved.join('\n')              );
            await writeFile(`${path}-${title}-extensions.json`, JSON.stringify(extensions, null, 2));
            await writeFile(`${path}-${title}-projects.json`  , JSON.stringify(projects  , null, 2));
        }

        const valuesMappedMarkdown = devops_auditlog_query.mapMarkdown(organization, auditLogEntries, securityTokens, members, offsetInSeconds, extensions, projects, correlationIdsFiltered);
        const valuesMappedHtml     = devops_auditlog_query.mapHtml    (organization, auditLogEntries, securityTokens, members, offsetInSeconds, extensions, projects, correlationIdsFiltered);

        const headers = ['timestamp', 'scope', 'actor',  'action', 'details'];

        await Promise.all([
            writeFile(`${path}-${title}.json`               , JSON.stringify       (auditLogEntries, null, 2            )),
            writeFile(`${path}-${title}.md`                 , Markdown.table       (`${title} - ${new Date().toISOString()}`, headers, valuesMappedMarkdown)),
            writeFile(`${path}-${title}.html`               , Html.tableWithSorting(`${title} - ${new Date().toISOString()}`, headers, valuesMappedHtml    )),
            writeFile(`${path}-${title}-securityTokens.json`, JSON.stringify       (securityTokens, null, 2             ))
        ]);

        console.log(JSON.stringify({
            tenant,
            organization,
            startTime,
            endTime,
            files: {
                json          : `${path}-${title}.json`,
                markdown      : `${path}-${title}.md`,
                html          : `${path}-${title}.html`,
                securityTokens: `${path}-${title}-securityTokens.json`
            },
            durationInSeconds: Helper.durationInSeconds(startDate)
        }, null, 2));
    }

    private static mapHtml(
        organization   : string,
        auditLogEntries: AzureDevOpsAuditLogEntry[],
        securityTokens : Array<AzureDevOpsSecurityTokenElement>,
        members        : Array<GraphMember>,
        offsetInSeconds: number,
        extensions     : InstalledExtension[],
        projects       : TeamProjectReference[],
        correlationIds : string[]
    ): string[][] {
        return auditLogEntries.map(p => [
            devops_auditlog_query.timeStampHtml(organization, p, offsetInSeconds, correlationIds),
            devops_auditlog_query.projectHtml(organization, p, securityTokens, projects, members),
            devops_auditlog_query.actorHtml(organization, p, members),
            p.actionId ?? '',
            devops_auditlog_query.detailsHtml(p, organization, securityTokens, members, extensions),
        ])
    }

    private static mapMarkdown(
        organization   : string,
        auditLogEntries: AzureDevOpsAuditLogEntry[],
        securityTokens : Array<AzureDevOpsSecurityTokenElement>,
        members        : Array<GraphMember>,
        offsetInSeconds: number,
        extensions     : InstalledExtension[],
        projects       : TeamProjectReference[],
        correlationIds : string[]
    ): string[][] {
        return auditLogEntries.map(p => [
            devops_auditlog_query.timeStampMarkdown(organization, p, offsetInSeconds, correlationIds),
            devops_auditlog_query.projectMarkdown(organization, p, securityTokens, projects, members),
            devops_auditlog_query.actorMarkdown(organization, p, members),
            p.actionId ?? '',
            devops_auditlog_query.detailsMarkdown(p, organization, securityTokens, members, extensions),
        ])
    }

    private static getCorrelationIds(auditLogEntries: AzureDevOpsAuditLogEntry[]): Array<string>{
        const correlationIds = new Map<string, number>();
        for (const entry of auditLogEntries) {
            if (entry.correlationId !== undefined) {
                const count = correlationIds.get(entry.correlationId);
                if (count === undefined) {
                    correlationIds.set(entry.correlationId, 1);
                }
                else {
                    correlationIds.set(entry.correlationId, count + 1);
                }
            }
        }
        const correlationIdsFiltered = new Array<string>();
        for (const item of correlationIds) {
            if(item[1] > 1){
                correlationIdsFiltered.push(item[0])
            }
        }
        return correlationIdsFiltered;
    }

    private static project(organization: string, auditLogEntry: AzureDevOpsAuditLogEntry, securityTokens: Array<AzureDevOpsSecurityTokenElement>, projects: TeamProjectReference[], members                 : Array<GraphMember>, funcLink: (title: string, url: string, tooltip: string) => string): string {

        if (auditLogEntry.projectName !== undefined && auditLogEntry.projectName !== null) {
            return funcLink(auditLogEntry.projectName, AzureDevOpsPortalLinks.Project(organization, auditLogEntry.projectName), 'open project');
        }

        return devops_auditlog_query.project_AuditLog_AccessLog               (organization, auditLogEntry,                           funcLink)
            ?? devops_auditlog_query.project_Extension_Installed              (organization, auditLogEntry,                           funcLink)
            ?? devops_auditlog_query.project_Extension_VersionUpdated         (organization, auditLogEntry,                           funcLink)
            ?? devops_auditlog_query.project_Group_UpdateGroupMembership_Add  (organization, auditLogEntry, members       , projects, funcLink)
            ?? devops_auditlog_query.project_Licensing_Assigned               (organization, auditLogEntry,                           funcLink)
            ?? devops_auditlog_query.project_Licensing_Modified               (organization, auditLogEntry,                           funcLink)
            ?? devops_auditlog_query.project_Licensing_Removed                (organization, auditLogEntry,                           funcLink)
            ?? devops_auditlog_query.project_Security_ModifyPermission        (organization, auditLogEntry, securityTokens, projects, funcLink)
            ?? devops_auditlog_query.project_Security_RemovePermission        (organization, auditLogEntry, securityTokens, projects, funcLink)
            ?? devops_auditlog_query.project_Security_RemoveAccessControlLists(organization, auditLogEntry, securityTokens, projects, funcLink)
            ?? devops_auditlog_query.project_Group_UpdateGroups_Delete        (organization, auditLogEntry,                           funcLink)
            ?? devops_auditlog_query.project_Group_UpdateGroups_Modify        (organization, auditLogEntry,                           funcLink)
            ?? '';
    }
    private static project_AuditLog_AccessLog(organization: string, auditLogEntry: AzureDevOpsAuditLogEntry, funcLink: (title: string, url: string, tooltip: string) => string): string | undefined {
        if (auditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.AuditLog_AccessLog) {
            return funcLink(auditLogEntry.scopeDisplayName ?? organization, AzureDevOpsPortalLinks.OrganizationAuditLog(organization), 'open auditLog');
        }
        return undefined;
    }
    private static project_Extension_Installed(organization: string, auditLogEntry: AzureDevOpsAuditLogEntry, funcLink: (title: string, url: string, tooltip: string) => string): string | undefined {
        if (auditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Extension_Installed) {
            return funcLink(auditLogEntry.scopeDisplayName ?? organization, AzureDevOpsPortalLinks.OrganizationExtensions(organization), 'open extentions');
        }
        return undefined;
    }
    private static project_Extension_VersionUpdated(organization: string, auditLogEntry: AzureDevOpsAuditLogEntry, funcLink: (title: string, url: string, tooltip: string) => string): string | undefined {
        if (auditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Extension_VersionUpdated) {
            return funcLink(auditLogEntry.scopeDisplayName ?? organization, AzureDevOpsPortalLinks.OrganizationExtensions(organization), 'open extentions');
        }
        return undefined;
    }
    private static project_Group_UpdateGroupMembership_Add(organization: string, auditLogEntry: AzureDevOpsAuditLogEntry, members : Array<GraphMember>, projects: TeamProjectReference[], funcLink: (title: string, url: string, tooltip: string) => string): string | undefined {
        if (auditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Group_UpdateGroupMembership_Add) {
            const data : AzureDevOpsAuditLogEntry_Data_GroupUpdateGroupMembership = auditLogEntry.data;
              
            const scope = data.GroupName !== undefined && data.GroupName.startsWith('[') && data.GroupName.indexOf(']') > 0 ? data.GroupName.substring(1, data.GroupName.indexOf(']')) : undefined;
            const graphGroup  = members.filter(p => AzureDevOpsHelper.isGraphGroup(p)).find(p => data.GroupName !== undefined && p.principalName?.toLowerCase() === data.GroupName?.toLowerCase());

            const project = projects.find(project => scope!== undefined && project?.name?.toLowerCase() === scope.toLowerCase());

            if(project?.name !== undefined){
                return funcLink(project.name, AzureDevOpsPortalLinks.Permissions(organization, project.name, graphGroup?.descriptor), 'open permissions');
            }

            if (scope?.toLowerCase() === organization.toLowerCase()) {
                return funcLink(auditLogEntry.scopeDisplayName ?? scope, AzureDevOpsPortalLinks.Permissions(organization, undefined, undefined), 'open permissions');
            }

            if (scope !== undefined) {
                return funcLink(auditLogEntry.scopeDisplayName ?? scope, AzureDevOpsPortalLinks.Permissions(organization, undefined, undefined), 'open permissions');
            }
        }
        return undefined;
    }
    private static project_Licensing_Assigned(organization: string, auditLogEntry: AzureDevOpsAuditLogEntry, funcLink: (title: string, url: string, tooltip: string) => string): string | undefined {
        if (auditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Licensing_Assigned) {
            return funcLink(auditLogEntry.scopeDisplayName ?? organization, AzureDevOpsPortalLinks.OrganizationUsers(organization), 'open users');
        }
        return undefined;
    }
    private static project_Licensing_Modified(organization: string, auditLogEntry: AzureDevOpsAuditLogEntry, funcLink: (title: string, url: string, tooltip: string) => string): string | undefined {
        if (auditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Licensing_Modified) {
            return funcLink(auditLogEntry.scopeDisplayName ?? organization, AzureDevOpsPortalLinks.OrganizationUsers(organization), 'open users');
        }
        return undefined;
    }
    private static project_Licensing_Removed(organization: string, auditLogEntry: AzureDevOpsAuditLogEntry, funcLink: (title: string, url: string, tooltip: string) => string): string | undefined {
        if (auditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Licensing_Removed) {
            return funcLink(auditLogEntry.scopeDisplayName ?? organization, AzureDevOpsPortalLinks.OrganizationUsers(organization), 'open users');
        }
        return undefined;
    }
    private static project_Security_ModifyPermission(organization: string, auditLogEntry: AzureDevOpsAuditLogEntry, securityTokens: Array<AzureDevOpsSecurityTokenElement>, projects: TeamProjectReference[], funcLink: (title: string, url: string, tooltip: string) => string): string | undefined {
        if (auditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Security_ModifyPermission) {
            const data: AzureDevOpsAuditLogEntry_Data_SecurityModifyPermission = auditLogEntry.data;
            const securityToken = devops_auditlog_query.resolveSecurityTokenId(securityTokens, data.NamespaceId, data.Token);

            if (securityToken?.project?.name !== undefined) {
                return funcLink(securityToken?.project?.name, AzureDevOpsPortalLinks.Project(organization, securityToken?.project?.name), 'open project');
            }
            else {
                if (data.Token !== undefined) {
                    const project = AzureDevOpsSecurityTokenParser.getProject(`${data.NamespaceName}`, data.Token, projects, securityTokens);

                    if (project !== undefined) {
                        return funcLink(`${project.name}`, AzureDevOpsPortalLinks.Project(organization, `${project.name}`), 'open project')
                    }
                }
            }
        }
        return undefined;
    }
    private static project_Security_RemovePermission(organization: string, auditLogEntry: AzureDevOpsAuditLogEntry, securityTokens: Array<AzureDevOpsSecurityTokenElement>, projects: TeamProjectReference[], funcLink: (title: string, url: string, tooltip: string) => string): string | undefined {
        if (auditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Security_RemovePermission) {
            const data: AzureDevOpsAuditLogEntry_Data_SecurityRemovePermission = auditLogEntry.data;
            const securityToken = devops_auditlog_query.resolveSecurityTokenId(securityTokens, data.NamespaceId, data.Token);

            if (securityToken?.project?.name !== undefined) {
                return funcLink(securityToken?.project?.name, AzureDevOpsPortalLinks.Project(organization, securityToken?.project?.name), 'open project');
            }
            else {
                if (data.Token !== undefined) {
                    const project = AzureDevOpsSecurityTokenParser.getProject(`${data.NamespaceName}`, data.Token, projects, securityTokens);

                    if (project !== undefined) {
                        return funcLink(`${project.name}`, AzureDevOpsPortalLinks.Project(organization, `${project.name}`), 'open project')
                    }
                    else if (data.Token.startsWith('$PROCESS:')) {
                        return funcLink(auditLogEntry.scopeDisplayName ?? organization, AzureDevOpsPortalLinks.OrganizationProcess(organization), 'open processes')
                    }
                }
            }
        }
        return undefined;
    }
    private static project_Security_RemoveAccessControlLists(organization: string, auditLogEntry: AzureDevOpsAuditLogEntry, securityTokens: Array<AzureDevOpsSecurityTokenElement>, projects: TeamProjectReference[], funcLink: (title: string, url: string, tooltip: string) => string): string | undefined {
        if (auditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Security_RemoveAccessControlLists) {
            const data: AzureDevOpsAuditLogEntry_Data_SecurityRemoveAccessControlLists = auditLogEntry.data;

            if (data.Tokens !== undefined) {
                const projectsNames = [...new Set<string>(data.Tokens.map(token => AzureDevOpsSecurityTokenParser.getProject(`${data.NamespaceName}`, token, projects, securityTokens)).filter(p => p !== undefined).map(p => p!).map(p => p.name).filter(p => p !== undefined).map(p => p!))];

                if (projectsNames.length === 1) {
                    return funcLink(projectsNames[0], AzureDevOpsPortalLinks.Project(organization, projectsNames[0]), 'open project')
                }
            }
        }
        return undefined;
    }
    private static project_Group_UpdateGroups_Delete(organization: string, azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry, funcLink: (title: string, url: string, tooltip: string) => string): string | undefined {
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Group_UpdateGroups_Delete) {
            // [ProjectName]\GroupName group was deleted
            const indexEnd = `${azureDevOpsAuditLogEntry.details}`.indexOf(']');
            if (`${azureDevOpsAuditLogEntry.details}`.startsWith('[') && indexEnd > 1) {
                const projectName = `${azureDevOpsAuditLogEntry.details}`.substring(1, indexEnd);
                return funcLink(`${projectName}`, AzureDevOpsPortalLinks.Project(organization, projectName), 'open project');
            }
        }

        return undefined;
    }
    private static project_Group_UpdateGroups_Modify(organization: string, azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry, funcLink: (title: string, url: string, tooltip: string) => string): string | undefined {
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Group_UpdateGroups_Modify) {
            // [ProjectName]\GroupName group information was updated
            const indexEnd = `${azureDevOpsAuditLogEntry.details}`.indexOf(']');
            if (`${azureDevOpsAuditLogEntry.details}`.startsWith('[') && indexEnd > 1) {
                const projectName = `${azureDevOpsAuditLogEntry.details}`.substring(1, indexEnd);
                return funcLink(`${projectName}`, AzureDevOpsPortalLinks.Project(organization, projectName), 'open project');
            }
        }

        return undefined;
    }

    private static projectHtml    (organization: string, auditLogEntry: AzureDevOpsAuditLogEntry, securityTokens: Array<AzureDevOpsSecurityTokenElement>, projects: TeamProjectReference[], members: Array<GraphMember>): string { return devops_auditlog_query.project(organization, auditLogEntry, securityTokens, projects, members, Html    .getLinkWithToolTip); }
    private static projectMarkdown(organization: string, auditLogEntry: AzureDevOpsAuditLogEntry, securityTokens: Array<AzureDevOpsSecurityTokenElement>, projects: TeamProjectReference[], members: Array<GraphMember>): string { return devops_auditlog_query.project(organization, auditLogEntry, securityTokens, projects, members, Markdown.getLinkWithToolTip); }

    private static resolve_GroupUpdateGroupMembership_GroupNames(auditLogEntries: AzureDevOpsAuditLogEntry[]): Array<string> {
        const groupNames = [...new Set<string>((
            auditLogEntries.filter(p => p.actionId === AzureDevOpsAuditLogEntryActionIds.Group_UpdateGroupMembership_Add || p.actionId === AzureDevOpsAuditLogEntryActionIds.Group_UpdateGroupMembership_Remove)
                           .filter(p => p.data !== undefined)
                           .map   (p => p.data as AzureDevOpsAuditLogEntry_Data_GroupUpdateGroupMembership)
                           .map   (p => p.GroupName)
                           .filter(p => p !== undefined)
                           .map   (p => p!)
        ))];

        return groupNames;
    }

    private static resolve_GroupsCreate_GroupNames(auditLogEntries: AzureDevOpsAuditLogEntry[]): Array<string> {
        const groupNames = [...new Set<string>((
            auditLogEntries.filter(p => p.actionId === AzureDevOpsAuditLogEntryActionIds.Group_CreateGroups)
                           .filter(p => p.data !== undefined)
                           .map   (p => p.data as AzureDevOpsAuditLogEntry_Data_GroupCreateGroups)
                           .map   (p => p.GroupName)
                           .filter(p => p !== undefined)
                           .map   (p => p!)
        ))];

        return groupNames;
    }

    private static resolve_GroupUpdateGroupsModify_GroupNames(auditLogEntries: AzureDevOpsAuditLogEntry[]): Array<string> {
        const groupNames = [...new Set<string>((
            auditLogEntries.filter(p => p.actionId === AzureDevOpsAuditLogEntryActionIds.Group_UpdateGroups_Modify)
                           .filter(p => p.data !== undefined)
                           .map   (p => p.data as AzureDevOpsAuditLogEntry_Data_GroupUpdateGroupsModify)
                           .map   (p => p.GroupName)
                           .filter(p => p !== undefined)
                           .map   (p => p!)
        ))];

        return groupNames;
    }

    private static resolve_GroupUpdateGroupMembership_MemberNames(auditLogEntries: AzureDevOpsAuditLogEntry[]): Array<string> {
        const memberDisplayNames =  [...new Set<string>((
            auditLogEntries.filter(p => p.actionId === AzureDevOpsAuditLogEntryActionIds.Group_UpdateGroupMembership_Add || p.actionId === AzureDevOpsAuditLogEntryActionIds.Group_UpdateGroupMembership_Remove)
                           .filter(p => p.data !== undefined)
                           .map   (p => p.data as AzureDevOpsAuditLogEntry_Data_GroupUpdateGroupMembership)
                           .map   (p => p.MemberDisplayName)
                           .filter(p => p !== undefined)
                           .map   (p => p!)
        ))];

        return memberDisplayNames;
    }

    private static resolve_SecurityModifyPermission_MemberNames(auditLogEntries: AzureDevOpsAuditLogEntry[]): Array<string> {
        const memberDisplayNames =  [...new Set<string>((
            auditLogEntries.filter(p => p.actionId === AzureDevOpsAuditLogEntryActionIds.Security_ModifyPermission)
                           .filter(p => p.data !== undefined)
                           .map   (p => p.data as AzureDevOpsAuditLogEntry_Data_SecurityModifyPermission)
                           .map   (p => p.EventSummary?.map(m => m.subjectDisplayName))
                           .flat  ()
                           .filter(p => p !== undefined)
                           .map   (p => p!)
        ))];

        return memberDisplayNames;
    }

    private static resolve_SecurityModifyAccessControlLists_MemberNames(auditLogEntries: AzureDevOpsAuditLogEntry[]): Array<string> {
        const memberDisplayNames =  [...new Set<string>((
            auditLogEntries.filter(p => p.actionId === AzureDevOpsAuditLogEntryActionIds.Security_ModifyAccessControlLists)
                           .filter(p => p.data !== undefined)
                           .map   (p => p.data as AzureDevOpsAuditLogEntry_Data_SecurityModifyAccessControlLists)
                           .map   (p => p.EventSummary?.map(m => m.subjectDisplayName))
                           .flat  ()
                           .filter(p => p !== undefined)
                           .map   (p => p!)
        ))];

        return memberDisplayNames;
    }

    private static resolve_actorDisplayNames(auditLogEntries: AzureDevOpsAuditLogEntry[]): Array<string> {
        const memberDisplayNames = [...new Set<string>((
            auditLogEntries.map   (p => p.actorDisplayName)
                           .filter(p => p !== undefined)
                           .map   (p => p!)
        ))];

        return memberDisplayNames;
    }

    private static async resolve_Members(azureDevOpsHelper: AzureDevOpsHelper, organization: string, auditLogEntries: AzureDevOpsAuditLogEntry[]): Promise<Array<GraphMember>> {
        const memberDisplayNames = [...new Set<string>([
            ...devops_auditlog_query.resolve_actorDisplayNames                           (auditLogEntries),
            ...devops_auditlog_query.resolve_GroupUpdateGroupMembership_GroupNames       (auditLogEntries),
            ...devops_auditlog_query.resolve_GroupsCreate_GroupNames                     (auditLogEntries),
            ...devops_auditlog_query.resolve_GroupUpdateGroupMembership_MemberNames      (auditLogEntries),
            ...devops_auditlog_query.resolve_SecurityModifyPermission_MemberNames        (auditLogEntries),
            ...devops_auditlog_query.resolve_SecurityModifyAccessControlLists_MemberNames(auditLogEntries)
        ])];
        
        const usersMemberDisplayNames  = memberDisplayNames.filter(p => p.startsWith('[') === false);
        const groupsMemberDisplayNames = memberDisplayNames.filter(p => p.startsWith('[') === true );

        const groupUpdateGroupsModify_GroupNames = devops_auditlog_query.resolve_GroupUpdateGroupsModify_GroupNames(auditLogEntries)

        const usersBatchedPromise  = Helper.batchCalls(usersMemberDisplayNames , memberDisplayName => azureDevOpsHelper.graphMemberByDisplayName  (organization, ['User' ], memberDisplayName));
        const groupsBatchedPromise = Helper.batchCalls(groupsMemberDisplayNames, memberDisplayName => azureDevOpsHelper.graphMemberByPrincipalName(organization, ['Group'], memberDisplayName));
        const groupsByDisplayNamePromise = Helper.batchCalls(
            groupUpdateGroupsModify_GroupNames, 
            memberDisplayName => azureDevOpsHelper.graphMemberByDisplayName(organization, ['Group'], memberDisplayName)
        );

        const usersBatched               = await usersBatchedPromise ;
        const groupsBatched              = await groupsBatchedPromise;
        const groupsByDisplayNameBatched = await groupsByDisplayNamePromise;

        const users               = usersBatched              .map(p => p.result).filter(p => p !== undefined).map(p => p!);
        const groups              = groupsBatched             .map(p => p.result).filter(p => p !== undefined).map(p => p!);
        const groupsByDisplayName = groupsByDisplayNameBatched.map(p => p.result).filter(p => p !== undefined).map(p => p!);

        // avoid duplicates
        for (const group of groupsByDisplayName) {
            if (groups.find(p => `${p.principalName}`.toLowerCase() === `${group.principalName}`.toLowerCase() === undefined)) {
                groups.push(group);
            }
        }

        return [...users, ...groups];
    }

    private static async resolveSecurityTokens(azureDevOpsHelper: AzureDevOpsHelper, organization: string) {
        const projects = await azureDevOpsHelper.projects(organization);
        const projectNames = projects.filter(p => p.name !== undefined).map(p => p.name!);
        const securityTokensAll = await Helper.batchCalls(
            projectNames.map(projectName => { return { project: projectName } }),
            parameters => AzureDevOpsSecurityTokens.all(azureDevOpsHelper, organization, parameters.project)
        );
        const securityTokens = securityTokensAll.map(p => p.result).flat();
        securityTokens.sort((a, b) => { return a.id.toLowerCase().localeCompare(b.id.toLowerCase()) })
        return securityTokens;
    }

    private static timeStampMarkdown(organization: string, azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry, offsetInSeconds: number, correlationIds : string[]): string {
        return devops_auditlog_query.timeStamp(organization , azureDevOpsAuditLogEntry , offsetInSeconds, correlationIds, Markdown.getLinkWithToolTip);
    };
    private static timeStampHtml(organization: string, azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry, offsetInSeconds: number, correlationIds : string[]): string {
        return devops_auditlog_query.timeStamp(organization , azureDevOpsAuditLogEntry , offsetInSeconds, correlationIds, Html.getLinkWithToolTip);
    };
    private static timeStamp(organization: string, azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry, offsetInSeconds: number, correlationIds : string[], funcLink: (title: string, url: string, tooltip: string) => string): string {
        if (azureDevOpsAuditLogEntry === undefined) { return ''; }

        const value = azureDevOpsAuditLogEntry.timestamp;

        if (value === undefined) { return ''; }

        const date = Date.parse(value);

        if (Number.isNaN(date)) { return value; }

        const startTime = new Date(date - offsetInSeconds * 1000).toISOString();
        const endTime   = new Date(date + offsetInSeconds * 1000).toISOString();

        const url = funcLink(devops_auditlog_query.timeStampDisplay(value), devops_auditlog_query.auditLogUrl(organization, startTime, endTime), value);

        const showCorrelationId = correlationIds.some(p => p === azureDevOpsAuditLogEntry.correlationId);

        return `<pre>${url}` + (showCorrelationId ? `<br/>${azureDevOpsAuditLogEntry.correlationId}` : '') + `</pre>`;
    };

    private static timeStampDisplay(value: string) {
        const valueStripped = value.substring(0, value.indexOf('.') > 0 ? value.indexOf('.') : undefined) + 'Z';

        return valueStripped;
    }

    private static auditLogUrl  (organization: string, startTime: string, endTime: string)  { return `https://auditservice.dev.azure.com/${organization}/_apis/audit/auditlog?startTime=${startTime}&endTime=${endTime}` };



    private static actorMarkdown(organization: string, azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry, members: GraphMember[]): string {
        return devops_auditlog_query.actor(organization, azureDevOpsAuditLogEntry, members, Markdown.getLinkWithToolTip);
    }
    private static actorHtml(organization: string, azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry, members: GraphMember[]): string {
        return devops_auditlog_query.actor(organization, azureDevOpsAuditLogEntry, members, Html.getLinkWithToolTip);
    }
    private static actor(organization: string, azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry, members: GraphMember[], funcLink: (title: string, url: string, tooltip: string) => string): string {
        const member = members.find(p => AzureDevOpsHelper.isGraphUser(p) && `${p.principalName}`.toLowerCase() === `${azureDevOpsAuditLogEntry.actorUPN}`.toLowerCase());
        const linebreak = '</br>';
        return member?.descriptor === undefined || azureDevOpsAuditLogEntry.actorUPN === 'Azure DevOps Service'
            ? (azureDevOpsAuditLogEntry.actorDisplayName === azureDevOpsAuditLogEntry.actorUPN || azureDevOpsAuditLogEntry.actorUPN === null
              ? `${azureDevOpsAuditLogEntry.actorDisplayName}`
              : `${azureDevOpsAuditLogEntry.actorDisplayName}${linebreak}${azureDevOpsAuditLogEntry.actorUPN}`)
            : funcLink(
                `${azureDevOpsAuditLogEntry.actorDisplayName}`,
                AzureDevOpsPortalLinks.Permissions(organization, undefined, member.descriptor),
                `${azureDevOpsAuditLogEntry.actorUPN}`
            );
    }


    private static resolveSecurityTokenId(securityTokens: Array<AzureDevOpsSecurityTokenElement>, namespaceId: string | undefined, token: string | undefined): AzureDevOpsSecurityTokenElement | undefined {
        if (namespaceId === undefined) { return undefined; }
        if (token       === undefined) { return undefined; }

        const securityToken = securityTokens.find(p => p.securityNamespace.namespaceId?.toLowerCase() === namespaceId.toLowerCase() && p.token.toLowerCase() === token.toLowerCase());

        return securityToken;
    }


    private static detailsMarkdown(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        securityTokens          : Array<AzureDevOpsSecurityTokenElement>,
        members                 : Array<GraphMember>,
        extensions              : InstalledExtension[]
    ) : string {
        return devops_auditlog_query.details(azureDevOpsAuditLogEntry, organization, securityTokens, members, extensions, Markdown.getLinkWithToolTip);
    }

    private static detailsHtml(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        securityTokens          : Array<AzureDevOpsSecurityTokenElement>,
        members                 : Array<GraphMember>,
        extensions              : InstalledExtension[]
    ) : string {
        return devops_auditlog_query.details(azureDevOpsAuditLogEntry, organization, securityTokens, members, extensions, Html.getLinkWithToolTip);
    }

    private static details(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        securityTokens          : Array<AzureDevOpsSecurityTokenElement>,
        members                 : Array<GraphMember>,
        extensions              : InstalledExtension[],
        funcLink                : (title: string, url: string, tooltip: string) => string
    ) : string {
        if(azureDevOpsAuditLogEntry.data === undefined){
            return azureDevOpsAuditLogEntry.details ?? '';
        }

        return devops_auditlog_query.details_ExtensionInstalled              (azureDevOpsAuditLogEntry, extensions                           , funcLink)
            ?? devops_auditlog_query.details_ExtensionVersionUpdated         (azureDevOpsAuditLogEntry, extensions                           , funcLink)
            ?? devops_auditlog_query.details_GroupCreateGroups               (azureDevOpsAuditLogEntry, organization,                 members, funcLink)
            ?? devops_auditlog_query.details_GroupUpdateGroupMembership      (azureDevOpsAuditLogEntry, organization,                 members, funcLink)
            ?? devops_auditlog_query.details_GroupUpdateGroupsModify         (azureDevOpsAuditLogEntry, organization,                 members, funcLink)
            ?? devops_auditlog_query.details_GroupUpdateGroupsDelete         (azureDevOpsAuditLogEntry, organization,                          funcLink)
            ?? devops_auditlog_query.details_Licensing_Assigned              (azureDevOpsAuditLogEntry, organization,                 members, funcLink)
            ?? devops_auditlog_query.details_Licensing_Modified              (azureDevOpsAuditLogEntry, organization,                 members, funcLink)
            ?? devops_auditlog_query.details_Licensing_Removed               (azureDevOpsAuditLogEntry, organization,                 members, funcLink)
            ?? devops_auditlog_query.details_Policy_PolicyConfigCreated      (azureDevOpsAuditLogEntry, organization,                          funcLink)
            ?? devops_auditlog_query.details_Policy_PolicyConfigModified     (azureDevOpsAuditLogEntry, organization,                          funcLink)
            ?? devops_auditlog_query.details_Policy_PolicyConfigRemoved      (azureDevOpsAuditLogEntry, organization,                          funcLink)
            ?? devops_auditlog_query.details_ProjectProcessModify            (azureDevOpsAuditLogEntry, organization,                          funcLink)
            ?? devops_auditlog_query.details_ProjectAreaPathCreate           (azureDevOpsAuditLogEntry, organization,                          funcLink)
            ?? devops_auditlog_query.details_ProjectAreaPathDelete           (azureDevOpsAuditLogEntry, organization,                          funcLink)
            ?? devops_auditlog_query.details_ProjectAreaPathUpdate           (azureDevOpsAuditLogEntry, organization,                          funcLink)
            ?? devops_auditlog_query.details_ProjectIterationPathCreate      (azureDevOpsAuditLogEntry, organization,                          funcLink)
            ?? devops_auditlog_query.details_ProjectIterationPathDelete      (azureDevOpsAuditLogEntry, organization,                          funcLink)
            ?? devops_auditlog_query.details_ProjectIterationPathUpdate      (azureDevOpsAuditLogEntry, organization,                          funcLink)
            ?? devops_auditlog_query.details_SecurityModifyAccessControlLists(azureDevOpsAuditLogEntry, organization,                 members, funcLink)
            ?? devops_auditlog_query.details_SecurityModifyPermission        (azureDevOpsAuditLogEntry, organization, securityTokens, members, funcLink)
            ?? devops_auditlog_query.details_SecurityRemoveAccessControlLists(azureDevOpsAuditLogEntry,               securityTokens                   )
            ?? devops_auditlog_query.details_TokenPatCreateEvent             (azureDevOpsAuditLogEntry                                                 )
            ?? devops_auditlog_query.details_TokenPatRevokeEvent             (azureDevOpsAuditLogEntry                                                 )
            ?? azureDevOpsAuditLogEntry.details
            ?? '';
    }

    private static details_GroupUpdateGroupMembership(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        members                 : Array<GraphMember>,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ) : string | undefined {
      if ((azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Group_UpdateGroupMembership_Add || azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Group_UpdateGroupMembership_Remove)) {
            const data: AzureDevOpsAuditLogEntry_Data_GroupUpdateGroupMembership = azureDevOpsAuditLogEntry.data;

            const graphGroup = members.filter(p=>AzureDevOpsHelper.isGraphGroup(p))
                                      .find(p => data.GroupName         !== undefined && p.principalName?.toLowerCase() === data.GroupName?.toLowerCase());
            const member     = members.find(p => data.MemberDisplayName !== undefined && (p.displayName === data.MemberDisplayName || p.principalName === data.MemberDisplayName));

            if (graphGroup !== undefined && member !== undefined) {
                const details = `${
                    azureDevOpsAuditLogEntry.details?.replaceAll(`${data.GroupName        }`, funcLink(`${data.GroupName        }`, AzureDevOpsPortalLinks.Permissions(organization, undefined, graphGroup.descriptor), `open permissions for ${graphGroup.principalName}`))
                              .replaceAll(`${data.MemberDisplayName}`, funcLink(`${data.MemberDisplayName}`, AzureDevOpsPortalLinks.Permissions(organization, undefined, member    .descriptor), `open permissions for ${member.principalName}`))
                }`;

                return details;
            }
            else if (graphGroup !== undefined && member === undefined) {
                const details = `${
                    azureDevOpsAuditLogEntry.details?.replaceAll(`${data.GroupName        }`, funcLink(`${data.GroupName        }`, AzureDevOpsPortalLinks.Permissions(organization, undefined, graphGroup.descriptor), `open permissions for ${graphGroup.principalName}`))
                }`;

                return details;
            }
            else if (graphGroup === undefined && member !== undefined) {
                const details =  `${
                    azureDevOpsAuditLogEntry.details?.replaceAll(`${data.MemberDisplayName}`, funcLink(`${data.MemberDisplayName}`, AzureDevOpsPortalLinks.Permissions(organization, undefined, member    .descriptor), `open permissions for ${member.principalName}`))
                }`;

                return details;
            }
            else if (graphGroup === undefined && member === undefined) {
                return `${azureDevOpsAuditLogEntry.details}`;
            }
        }

        return undefined;
    }
    private static details_GroupCreateGroups(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        members                 : Array<GraphMember>,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ) : string | undefined {
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Group_CreateGroups){
            const data: AzureDevOpsAuditLogEntry_Data_GroupCreateGroups = azureDevOpsAuditLogEntry.data;

            const graphGroup = members.filter(p=>AzureDevOpsHelper.isGraphGroup(p))
                                      .find(p => data.GroupName !== undefined && p.principalName?.toLowerCase() === data.GroupName?.toLowerCase());
           
            if (graphGroup !== undefined) {
                const details = `${azureDevOpsAuditLogEntry.details?.replaceAll(`${data.GroupName}`, funcLink(`${data.GroupName}`, AzureDevOpsPortalLinks.Permissions(organization, undefined, graphGroup.descriptor), `open permissions for ${graphGroup.principalName}`))}`;

                return details;
            }
            else {
                return `${azureDevOpsAuditLogEntry.details}`;
            }
        }

        return undefined;
    }
    private static details_GroupUpdateGroupsModify(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        members                 : Array<GraphMember>,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ) : string | undefined{
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Group_UpdateGroups_Modify) {
            const linebreak = '<br/>';
            const data: AzureDevOpsAuditLogEntry_Data_GroupUpdateGroupsModify = azureDevOpsAuditLogEntry.data;

            const graphGroups = members.filter(p => AzureDevOpsHelper.isGraphGroup(p))
                .filter(p => data.GroupName !== undefined && p.displayName?.toLowerCase() === data.GroupName?.toLowerCase());

            const groupUpdates = data.GroupUpdates?.map(p => `${p.DisplayName} | ${p.Description}`).sort().join(`${linebreak}${linebreak}`);

            const details = graphGroups !== undefined && graphGroups.length === 1
                          ? `${azureDevOpsAuditLogEntry.details?.replaceAll(`${graphGroups[0].principalName}`, funcLink(`${data.GroupName}`, AzureDevOpsPortalLinks.Permissions(organization, undefined, graphGroups[0].descriptor), `open permissions for ${graphGroups[0].principalName}`))}`
                          : azureDevOpsAuditLogEntry.details;

            return `${details}${linebreak}${linebreak}` +
                   `${data.GroupDescription}${linebreak}<hr/>${linebreak}` +
                   `${groupUpdates}`;
        } 

        return undefined;
    }
    private static details_GroupUpdateGroupsDelete(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ): string | undefined {
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Group_UpdateGroups_Delete) {
            // [ProjectName]\GroupName group was deleted
            const indexEnd = `${azureDevOpsAuditLogEntry.details}`.indexOf(']');
            if (`${azureDevOpsAuditLogEntry.details}`.startsWith('[') && indexEnd > 1) {
                const projectName = `${azureDevOpsAuditLogEntry.details}`.substring(1, indexEnd);

                const link = funcLink(`${projectName}`, AzureDevOpsPortalLinks.Project(organization, projectName), 'open project');

                return `${azureDevOpsAuditLogEntry.details}`.replace(`${projectName}`, link);
            }
        }

        return undefined;
    }
    private static details_SecurityModifyAccessControlLists(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        members                 : Array<GraphMember>,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ) : string | undefined{
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Security_ModifyAccessControlLists) {
            const linebreak = '<br/>';

            const data: AzureDevOpsAuditLogEntry_Data_SecurityModifyAccessControlLists = azureDevOpsAuditLogEntry.data;

            const eventSummary = data.EventSummary?.map(event => {
                const member = members.find(member => event.subjectDisplayName !== undefined 
                                                   && (event.subjectDisplayName === member.displayName || event.subjectDisplayName === member.principalName));
                if (member === undefined) {
                    return `${event.change} '${data.NamespaceName}\\${event.permissionNames}' for '${event.subjectDisplayName}'`
                }
                else {
                    return `${event.change} '${data.NamespaceName}\\${event.permissionNames}' for '${funcLink(`${event.subjectDisplayName}`, AzureDevOpsPortalLinks.Permissions(organization, undefined, member.descriptor), `open permissions for ${member.principalName}`)}'`
                }
            }).sort().join(linebreak);
 
            return `${azureDevOpsAuditLogEntry.details}${linebreak}${linebreak}${eventSummary}`;
        }

        return undefined;
    }
    private static details_SecurityModifyPermission_link(
        data                 : AzureDevOpsAuditLogEntry_Data_SecurityModifyPermission,
        organization         : string,
        securityTokens       : Array<AzureDevOpsSecurityTokenElement>,
        useProjectNameAsTitle: boolean,
        funcLink             : (title: string, url: string, tooltip: string) => string
    ) : string | undefined{
        const securityToken = devops_auditlog_query.resolveSecurityTokenId(securityTokens, data.NamespaceId, data.Token);

        if (securityToken?.project !== undefined) {
            const title = useProjectNameAsTitle
                        ? `${securityToken.project.name}`
                        : `${data.NamespaceName} ${securityToken.id}`;
            if (securityToken.securityNamespace.name === 'Analytics') {
                return funcLink(title, AzureDevOpsPortalLinks.Project(organization, `${securityToken.project.name}`), 'open project');
            }

            if (securityToken.securityNamespace.name === 'CSS') {
                return funcLink(title, AzureDevOpsPortalLinks.ProjectConfigurationAreas(organization, `${securityToken.project.name}`), 'open area path configuration');
            }

            if (securityToken.securityNamespace.name === 'DashboardsPrivileges') {
                return funcLink(title, AzureDevOpsPortalLinks.ProjectDashboards(organization, `${securityToken.project.name}`), 'open dashboards');
            }

            if (securityToken.securityNamespace.name === 'Iteration') {
                return funcLink(title, AzureDevOpsPortalLinks.ProjectConfigurationIterations(organization, `${securityToken.project.name}`), 'open area path configuration');
            }

            if (securityToken.securityNamespace.name === 'Git Repositories') {
                return funcLink(title, AzureDevOpsPortalLinks.ProjectConfigurationRepositories(organization, `${securityToken.project.name}`), 'open git repositories');
            }

            if (securityToken.securityNamespace.name === 'Identity') {
                return funcLink(title, AzureDevOpsPortalLinks.Project(organization, `${securityToken.project.name}`), 'open project');
            }

            if (securityToken.securityNamespace.name === 'Plan') {
                return funcLink(title, AzureDevOpsPortalLinks.ProjectDeliveryPlans(organization, `${securityToken.project.name}`), 'open delviery plans');
            }

            if (securityToken.securityNamespace.name === 'Project') {
                return funcLink(title, AzureDevOpsPortalLinks.Project(organization, `${securityToken.project.name}`), 'open project');
            }

            if (securityToken.securityNamespace.name === 'Tagging') {
                return funcLink(title, AzureDevOpsPortalLinks.Project(organization, `${securityToken.project.name}`), 'open project');
            }

            if (securityToken.securityNamespace.name === 'WorkItemQueryFolders') {
                return funcLink(title, AzureDevOpsPortalLinks.ProjectWorkItemQueryFolders(organization, `${securityToken.project.name}`), 'open git repositories');
            }

            return funcLink(title, AzureDevOpsPortalLinks.Project(organization, `${securityToken.project.name}`), 'open project');
        }

        if (securityToken !== undefined) {
            const title = `${data.NamespaceName} ${securityToken.id}`;

            if (securityToken.securityNamespace.name === 'AuditLog') {
                return funcLink(title, AzureDevOpsPortalLinks.OrganizationAuditLog(organization), 'open auditLog');
            }

            if (securityToken.securityNamespace.name === 'Git Repositories') {
                return funcLink(title, AzureDevOpsPortalLinks.OrganizationConfigurationRepositories(organization), 'open git repositories');
            }

            if (securityToken.securityNamespace.name === 'Process') {
                return funcLink(title, AzureDevOpsPortalLinks.OrganizationProcess(organization), 'open processes');
            }

            return funcLink(title, AzureDevOpsPortalLinks.OrganizationConfiguration(organization), 'open organization');
        }

        return undefined;
    }
    private static details_SecurityModifyPermission(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        securityTokens          : Array<AzureDevOpsSecurityTokenElement>,
        members                 : Array<GraphMember>,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ) : string | undefined{
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Security_ModifyPermission) {
            const linebreak = '<br/>';

            const data: AzureDevOpsAuditLogEntry_Data_SecurityModifyPermission = azureDevOpsAuditLogEntry.data;

            const eventSummary = data.EventSummary?.map(event => {
                const member = members.find(member => event.subjectDisplayName !== undefined 
                                                   && (event.subjectDisplayName === member.displayName || event.subjectDisplayName === member.principalName));
                if (member === undefined) {
                    return `${event.change} '${data.NamespaceName}/${event.permissionNames}' for '${event.subjectDisplayName}'`
                }
                else {
                    return `${event.change} '${data.NamespaceName}/${event.permissionNames}' for '${funcLink(`${event.subjectDisplayName}`, AzureDevOpsPortalLinks.Permissions(organization, undefined, member.descriptor), 'open permissions')}'`
                }
            }).sort().join(linebreak);

            const eventSummaryAzureCli
                = data.EventSummary === undefined
                ? ''
                : [...new Set<string>(
                    data.EventSummary
                        .map(event => { return members.find(member => event.subjectDisplayName !== undefined && (event.subjectDisplayName === member.displayName || event.subjectDisplayName === member.principalName)); })
                        .filter(graphMember => graphMember !== undefined)
                        .map(graphMember => graphMember!)
                        .map(graphMember => '<hr/>' + 
                                            funcLink(
                                                AzureDevOpsHelper.isGraphGroup(graphMember)? `${graphMember.principalName}` : `${graphMember.displayName}`, 
                                                AzureDevOpsPortalLinks.Permissions(organization, undefined, graphMember.descriptor),
                                                `open permissions for ${graphMember.principalName}`
                                            ) + linebreak + linebreak +
                                            az_devops_security_permission.show(organization, `${data.NamespaceId}`, `${graphMember.descriptor}`, `${data.Token}`).replaceAll('--', `${linebreak}--`)
                            )
                  )]
                  .sort().join(`${linebreak}${linebreak}`);

            const useProjectNameAsTitle = false;
            const linkProject = devops_auditlog_query.details_SecurityModifyPermission_link(data, organization, securityTokens,useProjectNameAsTitle, funcLink );

            if (linkProject !== undefined) {
                return `${azureDevOpsAuditLogEntry.details}${linebreak}${linebreak}`+
                       `${linkProject} ${linebreak}${linebreak}` +
                       `${eventSummary}${linebreak}${linebreak}`+
                       `<pre>${eventSummaryAzureCli}</pre>`;
            }
            else {
                return `${azureDevOpsAuditLogEntry.details}${linebreak}${linebreak}` +
                       `${data.NamespaceName} ${data.Token}${linebreak}${linebreak}` +
                       `${eventSummary}${linebreak}${linebreak}`+
                       `<pre>${eventSummaryAzureCli}</pre>`;
            }
        }

        return undefined;
    }
    private static details_SecurityRemoveAccessControlLists(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        securityTokens          : Array<AzureDevOpsSecurityTokenElement>,
    ) : string | undefined{
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Security_RemoveAccessControlLists) {
            const linebreak = '<br/>';

            const data: AzureDevOpsAuditLogEntry_Data_SecurityRemoveAccessControlLists = azureDevOpsAuditLogEntry.data;

            const securityTokensResolved = data.Tokens?.map(securityToken => devops_auditlog_query.resolveSecurityTokenId(securityTokens, data.NamespaceId, securityToken)).filter(p => p !== undefined).map(p => p!);

            if (securityTokensResolved !== undefined && securityTokensResolved.length > 0) {
                return `${azureDevOpsAuditLogEntry.details}${linebreak}${linebreak}` +
                       `${data.NamespaceName} Recurse(${data.Recurse})${linebreak}${linebreak}` +
                       securityTokensResolved.map(p => p.id).join(linebreak);
            }
            else {
                return `${azureDevOpsAuditLogEntry.details}${linebreak}${linebreak}` +
                       `${data.NamespaceName} Recurse(${data.Recurse})`;
            }
        }

        return undefined;
    }
    private static details_TokenPatCreateEvent(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
    ) : string | undefined{
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Token_PatCreateEvent) {
            const linebreak = '<br/>';

            const data: AzureDevOpsAuditLogEntry_Data_TokenPatCreateEvent = azureDevOpsAuditLogEntry.data;

            const scopes = data.Scopes?.filter(p => p !== undefined).map(p => `- ${p}`).sort().join(linebreak);

            return `${azureDevOpsAuditLogEntry.details}${linebreak}${linebreak}` +
                   `${data.OperationType} ${data.TokenType} ${data.DisplayName} ` +
                   `from ${devops_auditlog_query.timeStampDisplay(data.ValidFrom ?? '')} to ${devops_auditlog_query.timeStampDisplay(data.ValidTo ?? '')} ${linebreak}` +
                   scopes;
        }

        return undefined;
    }
    private static details_TokenPatRevokeEvent(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
    ) : string | undefined{
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Token_PatRevokeEvent) {
            const linebreak = '<br/>';

            const data: AzureDevOpsAuditLogEntry_Data_TokenPatRevokeEvent = azureDevOpsAuditLogEntry.data;

            const scopes = data.Scopes?.filter(p => p !== undefined).map(p => `- ${p}`).sort().join(linebreak);

            return `${azureDevOpsAuditLogEntry.details}${linebreak}${linebreak}` +
                   `${data.OperationType} ${data.TokenType} ${data.DisplayName} ` +
                   `from ${devops_auditlog_query.timeStampDisplay(data.ValidFrom ?? '')} to ${devops_auditlog_query.timeStampDisplay(data.ValidTo ?? '')} ${linebreak}` +
                   scopes;
        }

        return undefined;
    }
    private static details_ExtensionVersionUpdated(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        extensions              : InstalledExtension[],
        funcLink                : (title: string, url: string, tooltip: string) => string
    ) : string | undefined{
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Extension_VersionUpdated) {
            const data: AzureDevOpsAuditLogEntry_Data_ExtensionVersionUpdated = azureDevOpsAuditLogEntry.data;

            const extension = extensions.find(p => data.ExtensionName !== undefined
                                                && data.PublisherName !== undefined
                                                && p.extensionName    === data.ExtensionName
                                                && p.publisherName    === data.PublisherName);

            if (extension !== undefined) {
                return `${azureDevOpsAuditLogEntry.details}`
                    .replaceAll(`Extension "${     data.ExtensionName}`, 'Extension "'      + funcLink(`${data.ExtensionName}`, `https://marketplace.visualstudio.com/items?itemName=${extension.publisherId}.${extension.extensionId}`, 'show extension'))
                    .replaceAll(`from publisher "${data.PublisherName}`, 'from publisher "' + funcLink(`${data.PublisherName}`, `https://marketplace.visualstudio.com/publishers/${extension.publisherId}`                             , 'show extension'));
            }
        }

        return undefined;
    }
    private static details_ExtensionInstalled(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        extensions              : InstalledExtension[],
        funcLink                : (title: string, url: string, tooltip: string) => string
    ) : string | undefined{
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Extension_Installed) {
            const data: AzureDevOpsAuditLogEntry_Data_ExtensionInstalled = azureDevOpsAuditLogEntry.data;

            const extension = extensions.find(p => data.ExtensionName !== undefined
                                                && data.PublisherName !== undefined
                                                && p.extensionName    === data.ExtensionName
                                                && p.publisherName    === data.PublisherName);

            if (extension !== undefined) {
                return `${azureDevOpsAuditLogEntry.details}`
                    .replaceAll(`Extension "${     data.ExtensionName}`, 'Extension "'      + funcLink(`${data.ExtensionName}`, `https://marketplace.visualstudio.com/items?itemName=${extension.publisherId}.${extension.extensionId}`, 'show extension'))
                    .replaceAll(`from publisher "${data.PublisherName}`, 'from publisher "' + funcLink(`${data.PublisherName}`, `https://marketplace.visualstudio.com/publishers/${extension.publisherId}`                             , 'show extension'));
            }
        }

        return undefined;
    }
    private static details_ProjectAreaPathCreate(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ) : string | undefined{
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Project_AreaPath_Create) {
            const data: AzureDevOpsAuditLogEntry_Data_ProjectArea = azureDevOpsAuditLogEntry.data;

            if (data.Path !== undefined && data.ProjectName !== undefined) {
                if (`${azureDevOpsAuditLogEntry.details}`.startsWith(`Area path "${data.Path}\\`)) {
                    return `${azureDevOpsAuditLogEntry.details}`
                        .replaceAll(`Area path "${data.Path}\\`, 'Area path "' + funcLink(`${data.Path}\\`, AzureDevOpsPortalLinks.ProjectConfigurationAreas(organization, data.ProjectName), 'open iterations'))
                }
            
                if (`${azureDevOpsAuditLogEntry.details}`.startsWith(`Area path "${data.Path}`)) {
                    return `${azureDevOpsAuditLogEntry.details}`
                        .replaceAll(`Area path "${data.Path}`, 'Area path "' + funcLink(`${data.Path}`, AzureDevOpsPortalLinks.ProjectConfigurationAreas(organization, data.ProjectName), 'open iterations'))
                }
            }
        }

        return undefined;
    }
    private static details_ProjectAreaPathDelete(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ) : string | undefined{
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Project_AreaPath_Delete) {
            const data: AzureDevOpsAuditLogEntry_Data_ProjectArea = azureDevOpsAuditLogEntry.data;

            if (data.Path !== undefined && data.ProjectName !== undefined) {
                if (`${azureDevOpsAuditLogEntry.details}`.startsWith(`Area path "${data.Path}\\`)) {
                    return `${azureDevOpsAuditLogEntry.details}`
                        .replaceAll(`Area path "${data.Path}\\`, 'Area path "' + funcLink(`${data.Path}\\`, AzureDevOpsPortalLinks.ProjectConfigurationAreas(organization, data.ProjectName), 'open iterations'))
                }
            
                if (`${azureDevOpsAuditLogEntry.details}`.startsWith(`Area path "${data.Path}`)) {
                    return `${azureDevOpsAuditLogEntry.details}`
                        .replaceAll(`Area path "${data.Path}`, 'Area path "' + funcLink(`${data.Path}`, AzureDevOpsPortalLinks.ProjectConfigurationAreas(organization, data.ProjectName), 'open iterations'))
                }
            }
        }

        return undefined;
    }
    private static details_ProjectAreaPathUpdate(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ) : string | undefined{
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Project_AreaPath_Update) {
            const data: AzureDevOpsAuditLogEntry_Data_ProjectArea = azureDevOpsAuditLogEntry.data;

            if (data.Path !== undefined && data.ProjectName !== undefined) {
                if (`${azureDevOpsAuditLogEntry.details}`.startsWith(`Area path "${data.Path}\\`)) {
                    return `${azureDevOpsAuditLogEntry.details}`
                        .replaceAll(`Area path "${data.Path}\\`, 'Area path "' + funcLink(`${data.Path}\\`, AzureDevOpsPortalLinks.ProjectConfigurationAreas(organization, data.ProjectName), 'open iterations'))
                }
            
                if (`${azureDevOpsAuditLogEntry.details}`.startsWith(`Area path "${data.Path}`)) {
                    return `${azureDevOpsAuditLogEntry.details}`
                        .replaceAll(`Area path "${data.Path}`, 'Area path "' + funcLink(`${data.Path}`, AzureDevOpsPortalLinks.ProjectConfigurationAreas(organization, data.ProjectName), 'open iterations'))
                }
            }
        }

        return undefined;
    }
    private static details_ProjectIterationPathCreate(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ) : string | undefined{
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Project_IterationPath_Create) {
            const data: AzureDevOpsAuditLogEntry_Data_ProjectIteration = azureDevOpsAuditLogEntry.data;

            if (data.Path !== undefined && data.ProjectName !== undefined) {
                return `${azureDevOpsAuditLogEntry.details}`
                    .replaceAll(`IterationPath "${data.Path}`, 'IterationPath "' + funcLink(`${data.Path}`, AzureDevOpsPortalLinks.ProjectConfigurationIterations(organization, data.ProjectName), 'open iterations'))
            }
        }

        return undefined;
    }
    private static details_ProjectIterationPathDelete(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ) : string | undefined{
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Project_IterationPath_Delete) {
            const data: AzureDevOpsAuditLogEntry_Data_ProjectIteration = azureDevOpsAuditLogEntry.data;

            if (data.Path !== undefined && data.ProjectName !== undefined) {
                return `${azureDevOpsAuditLogEntry.details}`
                    .replaceAll(`IterationPath "${data.Path}`, 'IterationPath "' + funcLink(`${data.Path}`, AzureDevOpsPortalLinks.ProjectConfigurationIterations(organization, data.ProjectName), 'open iterations'))
            }
        }

        return undefined;
    }
    private static details_ProjectIterationPathUpdate(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ) : string | undefined{
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Project_IterationPath_Update) {
            const data: AzureDevOpsAuditLogEntry_Data_ProjectIteration = azureDevOpsAuditLogEntry.data;

            if (data.Path !== undefined && data.ProjectName !== undefined) {
                return `${azureDevOpsAuditLogEntry.details}`
                    .replaceAll(`IterationPath "${data.Path}`, 'IterationPath "' + funcLink(`${data.Path}`, AzureDevOpsPortalLinks.ProjectConfigurationIterations(organization, data.ProjectName), 'open iterations'))
            }
        }

        return undefined;
    }
    private static details_ProjectProcessModify(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ) : string | undefined{
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Project_Process_Modify) {
            const data: AzureDevOpsAuditLogEntry_Data_ProjectProcessModify = azureDevOpsAuditLogEntry.data;

            if (data.ProcessName !== undefined && data.OldProcessName !== undefined) {
                return `${azureDevOpsAuditLogEntry.details}`
                    .replaceAll(`"${data.ProcessName   }"`, '"' + funcLink(`${data.ProcessName   }`, AzureDevOpsPortalLinks.ProjectProcess(organization, data.ProcessName   ), `open process '${data.ProcessName   }'`) + '"')
                    .replaceAll(`"${data.OldProcessName}"`, '"' + funcLink(`${data.OldProcessName}`, AzureDevOpsPortalLinks.ProjectProcess(organization, data.OldProcessName), `open process '${data.OldProcessName}'`) + '"')
            }
        }

        return undefined;
    }
    private static details_Licensing_Assigned(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        members                 : Array<GraphMember>,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ): string | undefined {
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Licensing_Assigned) {
            const data: AzureDevOpsAuditLogEntry_Data_Licensing = azureDevOpsAuditLogEntry.data;

            if (data.AccessLevel !== undefined) {
                // "Early Adopter access level assigned to "displayName" "

                const prefix = `${data.AccessLevel} access level assigned to \"`;
                const suffix = '\"';
                if (`${azureDevOpsAuditLogEntry.details}`.startsWith(prefix) && `${azureDevOpsAuditLogEntry.details}`.trimEnd().endsWith(suffix)) {
                    const displayName = `${azureDevOpsAuditLogEntry.details}`.replace(prefix, '').replace(suffix, '').trim();

                    const membersForDisplayName = members.filter(p => p.displayName === displayName);

                    if (membersForDisplayName.length === 1) {
                        const link = funcLink(displayName, AzureDevOpsHelper.userEntitlementsUrl(organization, `${membersForDisplayName[0].descriptor}`), 'open details')
                        return `${azureDevOpsAuditLogEntry.details}`.replaceAll(displayName, link);
                    }
                }
            }
        }

        return undefined;
    }
    private static details_Licensing_Removed(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        members                 : Array<GraphMember>,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ): string | undefined {
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Licensing_Removed) {
            const data: AzureDevOpsAuditLogEntry_Data_Licensing = azureDevOpsAuditLogEntry.data;

            if (data.AccessLevel !== undefined) {
                // "Early Adopter access level removed from "displayName" "

                const prefix = `${data.AccessLevel} access level removed from \"`;
                const suffix = '\"';
                if (`${azureDevOpsAuditLogEntry.details}`.startsWith(prefix) && `${azureDevOpsAuditLogEntry.details}`.trimEnd().endsWith(suffix)) {
                    const displayName = `${azureDevOpsAuditLogEntry.details}`.replace(prefix, '').replace(suffix, '').trim();

                    const membersForDisplayName = members.filter(p => p.displayName === displayName);

                    if (membersForDisplayName.length === 1) {
                        const link = funcLink(displayName, AzureDevOpsHelper.userEntitlementsUrl(organization, `${membersForDisplayName[0].descriptor}`), 'open details')
                        return `${azureDevOpsAuditLogEntry.details}`.replaceAll(displayName, link);
                    }
                }
            }
        }

        return undefined;
    }
    private static details_Licensing_Modified(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        members                 : Array<GraphMember>,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ): string | undefined {
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Licensing_Modified) {
            const data: AzureDevOpsAuditLogEntry_Data_LicensingModified = azureDevOpsAuditLogEntry.data;

            if (data.AccessLevel !== undefined && data.PreviousAccessLevel !== undefined) {
                // "Access level modified from Early Adopter to Early Adopter for "displayName" "

                const prefix = `Access level modified from ${data.PreviousAccessLevel} to ${data.AccessLevel} for \"`;
                const suffix = '\"';
                if (`${azureDevOpsAuditLogEntry.details}`.startsWith(prefix) && `${azureDevOpsAuditLogEntry.details}`.trimEnd().endsWith(suffix)) {
                    const displayName = `${azureDevOpsAuditLogEntry.details}`.replace(prefix, '').replace(suffix, '').trim();

                    const membersForDisplayName = members.filter(p => p.displayName === displayName);

                    if (membersForDisplayName.length === 1) {
                        const link = funcLink(displayName, AzureDevOpsHelper.userEntitlementsUrl(organization, `${membersForDisplayName[0].descriptor}`), 'open details')
                        return `${azureDevOpsAuditLogEntry.details}`.replaceAll(displayName, link);
                    }
                }
            }
        }

        return undefined;
    }
    private static details_Policy_PolicyConfigCreated(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ): string | undefined {
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Policy_PolicyConfigCreated) {
            const data: AzureDevOpsAuditLogEntry_Data_PolicyPolicyConfigModified = azureDevOpsAuditLogEntry.data;

            if (data.PolicyTypeDisplayName !== undefined && data.ProjectName !== undefined) {
             // Modified <PolicyTypeDisplayName> policy in project <ProjectName>
             if (`${azureDevOpsAuditLogEntry.details}` === `Created ${data.PolicyTypeDisplayName} policy in project ${data.ProjectName}`) {
                const linkProject = funcLink(data.ProjectName  , AzureDevOpsPortalLinks.Project                         (organization, data.ProjectName), 'open project'                          );
                const linkRepo    = funcLink(`${data.RepoName}`, AzureDevOpsPortalLinks.ProjectConfigurationRepositories(organization, data.ProjectName), 'open repositories policy configuration');
                 
                 const linebreak = '</br>';

                 return `Modified ${data.PolicyTypeDisplayName} in project ${linkProject}${linebreak}<hr/>`
                      + (data.RepoName         === undefined || data.RepoName === null ? '' : `${linebreak}RepoName: ${linkRepo}`)
                      + (data.RefName          === undefined || data.RefName  === null ? '' : `${linebreak}RefName : ${data.RefName}`)
                      + (data.ConfigProperties === undefined                           ? '' : `${linebreak}${data.ConfigProperties.map(p => `${p.Property} '${p.Value}' (was '${p.OldValue}')`).sort().join(linebreak)}`);
                }
            }
        }

        return undefined;
    }
    private static details_Policy_PolicyConfigModified(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ): string | undefined {
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Policy_PolicyConfigModified) {
            const data: AzureDevOpsAuditLogEntry_Data_PolicyPolicyConfigModified = azureDevOpsAuditLogEntry.data;

            if (data.PolicyTypeDisplayName !== undefined && data.ProjectName !== undefined) {
             // Modified <PolicyTypeDisplayName> policy in project <ProjectName>
             if (`${azureDevOpsAuditLogEntry.details}` === `Modified ${data.PolicyTypeDisplayName} policy in project ${data.ProjectName}`) {
                const linkProject = funcLink(data.ProjectName  , AzureDevOpsPortalLinks.Project                         (organization, data.ProjectName), 'open project'                          );
                const linkRepo    = funcLink(`${data.RepoName}`, AzureDevOpsPortalLinks.ProjectConfigurationRepositories(organization, data.ProjectName), 'open repositories policy configuration');
                 
                 const linebreak = '</br>';

                 return `Modified ${data.PolicyTypeDisplayName} in project ${linkProject}${linebreak}<hr/>`
                      + (data.RepoName         === undefined || data.RepoName === null ? '' : `${linebreak}RepoName: ${linkRepo}`)
                      + (data.RefName          === undefined || data.RefName  === null ? '' : `${linebreak}RefName : ${data.RefName}`)
                      + (data.ConfigProperties === undefined                           ? '' : `${linebreak}${data.ConfigProperties.map(p => `${p.Property} '${p.Value}' (was '${p.OldValue}')`).join(linebreak)}`);
                }
            }
        }

        return undefined;
    }
    private static details_Policy_PolicyConfigRemoved(
        azureDevOpsAuditLogEntry: AzureDevOpsAuditLogEntry,
        organization            : string,
        funcLink                : (title: string, url: string, tooltip: string) => string
    ): string | undefined {
        if (azureDevOpsAuditLogEntry.actionId === AzureDevOpsAuditLogEntryActionIds.Policy_PolicyConfigRemoved) {
            const data: AzureDevOpsAuditLogEntry_Data_PolicyPolicyConfigRemoved = azureDevOpsAuditLogEntry.data;

            if (data.PolicyTypeDisplayName !== undefined && data.ProjectName !== undefined) {
             // Removed <PolicyTypeDisplayName> policy in project <ProjectName>
             if (`${azureDevOpsAuditLogEntry.details}` === `Removed ${data.PolicyTypeDisplayName} policy in project ${data.ProjectName}`) {
                const linkProject = funcLink(data.ProjectName  , AzureDevOpsPortalLinks.Project                         (organization, data.ProjectName), 'open project'                          );
                const linkRepo    = funcLink(`${data.RepoName}`, AzureDevOpsPortalLinks.ProjectConfigurationRepositories(organization, data.ProjectName), 'open repositories policy configuration');
                 
                 const linebreak = '</br>';

                 return `Modified ${data.PolicyTypeDisplayName} in project ${linkProject}${linebreak}<hr/>`
                      + (data.RepoName         === undefined || data.RepoName === null ? '' : `${linebreak}RepoName: ${linkRepo}`)
                      + (data.RefName          === undefined || data.RefName  === null ? '' : `${linebreak}RefName : ${data.RefName}`)
                      + (data.ConfigProperties === undefined                           ? '' : `${linebreak}${data.ConfigProperties.map(p => `${p.Property} '${p.Value}' (was '${p.OldValue}')`).join(linebreak)}`);
                }
            }
        }

        return undefined;
    }
}
