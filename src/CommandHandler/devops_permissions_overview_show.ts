import { AzureDevOpsAccessControlList, AzureDevOpsAccessControlListHelper             } from "../models/AzureDevOpsAccessControlEntry";
import { AzureDevOpsHelper                                                            } from "../AzureDevOpsHelper";
import { AzureDevOpsSecurityNamespace                                                 } from "../models/AzureDevOpsSecurityNamespace";
import { AzureDevOpsSecurityNamespaceAction, AzureDevOpsSecurityNamespaceActionHelper } from "../models/AzureDevOpsSecurityNamespaceAction";
import { GraphSubject                                                                 } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Identity                                                                     } from "azure-devops-node-api/interfaces/IdentitiesInterfaces";
import { writeFile                                                                    } from "fs/promises";
import { AzureDevOpsSecurityTokens                                                    } from "../AzureDevOpsSecurityTokens";
import { Helper                                                                       } from "../Helper";
import { Markdown                                                                     } from "../Converters/Markdown";
import { az_devops_security_permission                                                } from "../AzureCli/devops/security/permission";

export class devops_permissions_overview_show {
    static async handle(tenant: string, organization: string, project: string, securityNamespaceName: string, token: string, path: string): Promise<void> {
        const startDate = new Date();
        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenant);
        const securityNamespace = await azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);
        //securityNamespace.actions.sort(AzureDevOpsSecurityNamespaceActionHelper.sort);

        const securityTokens = await AzureDevOpsSecurityTokens.all(azureDevOpsHelper, organization, project);
        const securityToken = securityTokens.find(p => p.token === token);
        if (securityToken === undefined) {
            throw new Error(JSON.stringify({ organization, project, token, error: 'Failed to resolve securityToken.' }));
        }

        const parameters = {
            organization,
            securityNamespaceId: securityNamespace.namespaceId!,
            token,
            includeExtendedInfo: true
        };
        const accessControlLists = await azureDevOpsHelper.accessControlLists(parameters);
        
        const identityDescriptors = AzureDevOpsAccessControlListHelper.getIdentityDescriptors(accessControlLists);
        const identities          = await azureDevOpsHelper.identitiesByDescriptorExplicit(organization, identityDescriptors);
        const subjectDescriptors  = identities.filter(p => p.identity?.subjectDescriptor !== undefined).map(p => p.identity?.subjectDescriptor!);
        const graphSubjects       = await azureDevOpsHelper.graphSubjectsLookup(organization, subjectDescriptors);

        const accessControlListMapped = devops_permissions_overview_show.mapItems(securityNamespace, accessControlLists, identities, Helper.toArray(graphSubjects));

        const titleMarkDown = Markdown.tableKeyValue('scope', `${organization} / ${project}`, [
            { key: 'namespace', value: `${securityNamespace.name} [${securityNamespace.namespaceId}]`},
            { key: 'token'    , value: token},
        ]);

        const markdown = this.toMarkDown(
            organization,
            token,
            securityNamespace,
            titleMarkDown,
            securityToken.id,
            accessControlListMapped
        );

        const title = (`${organization}`
                    + `-${project}`
                    + `-${securityNamespace.name}`
                    + `-${securityToken.id}`
                    + `-permissions`)
                    .replaceAll(new RegExp('[^a-zA-Z0-9_]', 'g'),'_')
                    .replaceAll('__','_');

        await Promise.all([
            writeFile(`${path}-${title}.md`, markdown)
        ]);

        console.log(JSON.stringify({
            parameters: {
                tenant,
                organization,
                securityNamespaceName,
                token,
                path
            },
            durationInSeconds: Helper.durationInSeconds(startDate),
            files: {
                markdown: `${path}-${title}.md`
            }
        }, null, 2));
    }

    private static toMarkDown(
        organization:string,
        token:string,
        securityNamespace: AzureDevOpsSecurityNamespace,
        title            : string,
        tableHeader      : string,
        collection       : Array<Mapping>
    ) {

        const principal = (graphSubject: GraphSubject | undefined) :string=> {
            if (graphSubject?.url !== undefined && graphSubject.url.trim() !== '') {
                return `${Markdown.getLinkWithToolTip(graphSubject?.displayName ?? '??', graphSubject.url, 'show details')}`;
            }
            else {
                return `${graphSubject?.displayName ?? '??'}`;
            }
        }

        const lines = new Array<string>();
        lines.push(`## Scope`)
        lines.push(``)
        lines.push(`${title}`)
        lines.push(``)
        lines.push(`## Permissions`)
        lines.push(``)
        lines.push(`|${tableHeader}|${securityNamespace.actions.map(p => `${p.displayName}<br/>[bit ${p.bit}]|`).join('')}`);
        lines.push(`|:-            |${securityNamespace.actions.map(p => ':-: |'                               ).join('')}`);
 
        for (const acl of collection) {
            const line = Array<string | undefined>();
            line.push(`|${principal(acl.graphSubject)}`);
            for (const action of securityNamespace.actions) {
                const isAllow          = acl.allow         .mapping.find(p => p.bit === action.bit) !== undefined;
                const isDeny           = acl.deny          .mapping.find(p => p.bit === action.bit) !== undefined;
                const isAllowEffective = acl.allowEffective.mapping.find(p => p.bit === action.bit) !== undefined;
                const isDenyEffective  = acl.denyEffective .mapping.find(p => p.bit === action.bit) !== undefined;
                const isAllowInherited = acl.allowInherited.mapping.find(p => p.bit === action.bit) !== undefined;
                const isDenyInherited  = acl.denyInherited .mapping.find(p => p.bit === action.bit) !== undefined;

                     if (isDenyEffective  && isDenyInherited ) { line.push(`|Deny<br/>(inherited)` ); }
                else if (isAllowEffective && isAllowInherited) { line.push(`|Allow<br/>(inherited)`); }
                else if (isDenyEffective                     ) { line.push(`|Deny` ); }
                else if (isAllowEffective                    ) { line.push(`|Allow`); }
                else if (isDeny                              ) { line.push(`|Deny` ); }
                else if (isAllow                             ) { line.push(`|Allow`); }
                else if (isDenyInherited                     ) { line.push(`|Deny<br/>(inherited)` ); }
                else if (isAllowInherited                    ) { line.push(`|Allow<br/>(inherited)`); }
                else                                         { line.push(`|`     ); }
            }
            lines.push(line.join(''));
        }

        // lines.push(``)
        // lines.push(`## Samples`)
        // lines.push(``)

        // lines.push(`|sample |  |`);
        // lines.push(`|:-     |:-|`);
        // lines.push(`|[show  ](${az_devops_security_permission.showDocs  ()})|\`${az_devops_security_permission.show  (organization, `${securityNamespace?.namespaceId}`, `[subject]`, token                                             ).replaceAll('--', '\`<br/>--\`') }\`|`);
        // lines.push(`|[reset ](${az_devops_security_permission.resetDocs ()})|\`${az_devops_security_permission.reset (organization, `${securityNamespace?.namespaceId}`, `[subject]`, token, '[permission-bit]'                         ).replaceAll('--', '\`<br/>--\`') }\`|`);
        // lines.push(`|[update](${az_devops_security_permission.updateDocs()})|\`${az_devops_security_permission.update(organization, `${securityNamespace?.namespaceId}`, `[subject]`, token, '[allow-bit]', '[deny-bit]', '[true/false]').replaceAll('--', '\`<br/>--\`') }\`|`);

        lines.push(``)
        lines.push(`## Samples`)
        lines.push(``)

        lines.push(`|[show  ](${az_devops_security_permission.showDocs  ()}) | [reset ](${az_devops_security_permission.resetDocs ()})  | [update](${az_devops_security_permission.updateDocs()}) |`);
        lines.push(`|:-     |:-|:-|`);
        lines.push(`|\`${az_devops_security_permission.show  (organization, `${securityNamespace?.namespaceId}`, `[subject]`, token).replaceAll('--', '\`<br/>--\`') }\`<br/><br/><br/><br/>` + 
                   `|\`${az_devops_security_permission.reset (organization, `${securityNamespace?.namespaceId}`, `[subject]`, token, '[permission-bit]').replaceAll('--', '\`<br/>--\`') }\`<br/><br/><br/>`+
                   `|\`${az_devops_security_permission.update(organization, `${securityNamespace?.namespaceId}`, `[subject]`, token, '[allow-bit]', '[deny-bit]', '[true/false]').replaceAll('--', '\`<br/>--\`') }\`|`);



        lines.push(``)
        lines.push(`## Subjects`)
        lines.push(``)

        lines.push(`|${tableHeader}|subject |`);
        lines.push(`|:-            |:-      |`); 
        for (const acl of collection) {
            lines.push(`|${principal(acl.graphSubject)}|${acl.graphSubject?.descriptor ?? '??'}|`)
        }

        return lines.join('\n');
    }

    private static mapItems(
        securityNamespace : AzureDevOpsSecurityNamespace,
        accessControlLists: Array<AzureDevOpsAccessControlList>,
        identities        : Array<{ identityDescriptor: string, identity: Identity | undefined }>,
        graphSubjects     : Array<GraphSubject>
    ): Array<Mapping> {
        const accessControlListMapped = new Array<{
            identifier    : string,
            identity      : Identity     | undefined,
            graphSubject  : GraphSubject | undefined,
            allow         : number       | undefined,
            allowInherited: number       | undefined,
            allowEffective: number       | undefined,
            deny          : number       | undefined,
            denyInherited : number       | undefined,
            denyEffective : number       | undefined
        }>();

        for (const accessControlList of accessControlLists) {
            for (const key in accessControlList.acesDictionary) {
                const accessControlEntry = accessControlList.acesDictionary[key];

                const identity     = accessControlEntry.descriptor === undefined
                                   ? undefined
                                   : identities.find(p => p.identityDescriptor === accessControlEntry.descriptor)?.identity;

                const graphSubject = identity?.subjectDescriptor === undefined 
                                   ? undefined
                                   : graphSubjects.find(p => p.descriptor === identity.subjectDescriptor);


                accessControlListMapped.push({
                    identifier       : key,
                    identity         : identity,
                    graphSubject     : graphSubject,
                    allow            : accessControlEntry.allow,
                    deny             : accessControlEntry.deny,
                    allowInherited   : accessControlEntry.extendedInfo?.inheritedAllow,
                    allowEffective   : accessControlEntry.extendedInfo?.effectiveAllow,
                    denyInherited    : accessControlEntry.extendedInfo?.inheritedDeny,
                    denyEffective    : accessControlEntry.extendedInfo?.effectiveDeny
                });
            }
        }

        const accessControlListMappedActions = accessControlListMapped.map(p=> {
            return {
                identifier    : p.identifier,
                identity      : p.identity,
                graphSubject  : p.graphSubject,
                allow         : { value: p.allow         , mapping: AzureDevOpsHelper.azureDevOpsAccessControlEntryMapping(securityNamespace, p.allow         )},
                allowInherited: { value: p.allowInherited, mapping: AzureDevOpsHelper.azureDevOpsAccessControlEntryMapping(securityNamespace, p.allowInherited)},
                allowEffective: { value: p.allowEffective, mapping: AzureDevOpsHelper.azureDevOpsAccessControlEntryMapping(securityNamespace, p.allowEffective)},
                deny          : { value: p.deny          , mapping: AzureDevOpsHelper.azureDevOpsAccessControlEntryMapping(securityNamespace, p.deny          )},
                denyInherited : { value: p.denyInherited , mapping: AzureDevOpsHelper.azureDevOpsAccessControlEntryMapping(securityNamespace, p.denyInherited )},
                denyEffective : { value: p.denyEffective , mapping: AzureDevOpsHelper.azureDevOpsAccessControlEntryMapping(securityNamespace, p.denyEffective )},
            };
        });

        accessControlListMappedActions.sort((a: { graphSubject: GraphSubject | undefined }, b: { graphSubject: GraphSubject | undefined }) => `${a.graphSubject?.displayName}`.localeCompare(`${b.graphSubject?.displayName}`))

        return accessControlListMappedActions;
    }
}

interface Mapping {
    identifier    : string;
    identity      : Identity     | undefined;
    graphSubject  : GraphSubject | undefined;
    allow         : { value: number | undefined, mapping: Array<AzureDevOpsSecurityNamespaceAction> };
    allowInherited: { value: number | undefined, mapping: Array<AzureDevOpsSecurityNamespaceAction> };
    allowEffective: { value: number | undefined, mapping: Array<AzureDevOpsSecurityNamespaceAction> };
    deny          : { value: number | undefined, mapping: Array<AzureDevOpsSecurityNamespaceAction> };
    denyInherited : { value: number | undefined, mapping: Array<AzureDevOpsSecurityNamespaceAction> };
    denyEffective : { value: number | undefined, mapping: Array<AzureDevOpsSecurityNamespaceAction> };
}
