import { AzureDevOpsHelper                                                            } from "../AzureDevOpsHelper";
import { GraphSubject                                                                 } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Html                                                                         } from "../Converters/Html";
import { Markdown                                                                     } from "../Converters/Markdown";
import { writeFile                                                                    } from "fs/promises";
import { AzureDevOpsWrapper                                                           } from "../AzureDevOpsWrapper";
import { AzureDevOpsSecurityNamespaceAction, AzureDevOpsSecurityNamespaceActionHelper } from "../models/AzureDevOpsSecurityNamespaceAction";
import { AzureDevOpsSecurityTokens                                                    } from "../AzureDevOpsSecurityTokens";
import { Identity                                                                     } from "azure-devops-node-api/interfaces/IdentitiesInterfaces";
import { AzureDevOpsPortalLinks                                                       } from "../AzureDevOpsPortalLinks";
import { AzureDevOpsAccessControlList, AzureDevOpsAccessControlListHelper             } from "../models/AzureDevOpsAccessControlEntry";
import { AzureDevOpsSecurityNamespace                                                 } from "../models/AzureDevOpsSecurityNamespace";

export class devops_permissions_git_show {
    static async handle(tenantId: string, organization: string, project: string, repository: string, path: string): Promise<void> {
        const startDate = new Date();

        const baseUrl=`https://dev.azure.com/${organization}`;
        const securityNamespaceName = 'Git Repositories';

        const azureDevOpsWrapperPromise = AzureDevOpsWrapper.instance(baseUrl, tenantId);
        
        const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
        const securityNamespace = await azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);
        if (securityNamespace === undefined) {
            throw new Error(JSON.stringify({ organization, securityNamespaceName, error: 'Failed to resolve securityNamespace.' }));
        }
        securityNamespace.actions.sort(AzureDevOpsSecurityNamespaceActionHelper.sort);

        const azureDevOpsWrapper = await azureDevOpsWrapperPromise;
        const gitRepositoryPromise = azureDevOpsWrapper.gitRepository(project, repository);
        const gitRepository = await gitRepositoryPromise;
        const projectId = gitRepository.project?.id;
        if (projectId === undefined) {
            throw new Error(JSON.stringify({ organization, project, repository, gitRepository, error: 'Failed to resolve project.id.' }));
        }
        const repositoryId = gitRepository.id;
        if (repositoryId === undefined) {
            throw new Error(JSON.stringify({ organization, project, repository, gitRepository, error: 'Failed to resolve gitRepository.id.' }));
        }

        const parameters = {
            organization,
            securityNamespaceId: securityNamespace.namespaceId!,
            token: AzureDevOpsSecurityTokens.GitRepositories_Project_Repository(projectId, repositoryId),
            includeExtendedInfo: true
        };
        const accessControlLists = await azureDevOpsHelper.accessControlLists(parameters);
        if (accessControlLists.length === 0) { throw new Error(JSON.stringify({ parameters, accessControlLists })) }

        const identityDescriptors = AzureDevOpsAccessControlListHelper.getIdentityDescriptors(accessControlLists);

        const identities = await azureDevOpsHelper.identitiesByDescriptorExplicit(organization, identityDescriptors);

        const subjectDescriptors = identities.filter(p => p.identity?.subjectDescriptor !== undefined).map(p => p.identity?.subjectDescriptor!);
        const graphSubjects = await azureDevOpsHelper.graphSubjectsLookupArray(organization, subjectDescriptors);

        const accessControlListMapped = this.mapItems(securityNamespace, accessControlLists, identities, graphSubjects);

        const markdown = this.toMarkDown(
            organization,
            gitRepository.project?.name ?? projectId,
            gitRepository.name ?? repository,
            repositoryId, securityNamespace,
            accessControlListMapped
        );

        const title = `${organization}`
                    + `-${gitRepository.project?.name ?? projectId}`
                    + `-${gitRepository.name ?? repository}`
                    + `-permissions`;

        await Promise.all([
            writeFile(`${path}-${title}.md`, markdown)
        ]);

        console.log({
            parameters: {
                tenantId,
                organization,
                project,
                repository,
                path
            },
            durationInSeconds: (new Date().getTime() - startDate.getTime()) / 1000,
            files: {
                markdown: `${path}-${title}.md`
            }
        });
    }

    static toMarkDown(
        organization     : string,
        project          : string,
        repository       : string,
        repositoryId     : string,
        securityNamespace: AzureDevOpsSecurityNamespace,
        collection       : Array<Mapping>
    ) {
        const allActions = securityNamespace.actions.map(p => p.displayName);

        const lines = new Array<string>();
        lines.push(`[${organization} / ${project} / ${repository} Security Settings](${AzureDevOpsPortalLinks.repositorySettingsSecurity(organization, project, repositoryId)})`)
        lines.push(`|  |${allActions.map(p => `${p}|`).join('')}`);
        lines.push(`|:-|${allActions.map(p => ':-: |').join('')}`);
 
        for (const acl of collection) {
            const line = Array<string | undefined>();
            line.push(`|${acl.graphSubject?.displayName ?? acl.identity?.descriptor ?? acl.identifier}`);

            for (const action of securityNamespace.actions) {
                const isAllow          = acl.allow         .mapping.find(p => p.bit === action.bit) !== undefined;
                const isDeny           = acl.deny          .mapping.find(p => p.bit === action.bit) !== undefined;
                const isAllowEffective = acl.allowEffective.mapping.find(p => p.bit === action.bit) !== undefined;
                const isDenyEffective  = acl.denyEffective .mapping.find(p => p.bit === action.bit) !== undefined;
                const isAllowInherited = acl.allowInherited.mapping.find(p => p.bit === action.bit) !== undefined;
                const isDenyInherited  = acl.denyInherited .mapping.find(p => p.bit === action.bit) !== undefined;

                     if (isAllowInherited) { line.push(`|Allow`); }
                else if (isAllowEffective) { line.push(`|Allow`); }
                else if (isAllow         ) { line.push(`|Allow`); }
                else if (isDenyInherited ) { line.push(`|Deny` ); }
                else if (isDenyEffective ) { line.push(`|Deny` ); }
                else if (isDeny          ) { line.push(`|Deny` ); }
                else                       { line.push(`|`     ); }
            }
            lines.push(line.join(''));
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
