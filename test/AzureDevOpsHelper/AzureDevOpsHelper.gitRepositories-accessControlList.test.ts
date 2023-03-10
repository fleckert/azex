import   path                                 from "path";
import { AzureDevOpsHelper                  } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsSecurityTokens          } from "../../src/AzureDevOpsSecurityTokens";
import { TestConfigurationProvider          } from "../_Configuration/TestConfiguration";
import { writeFile                          } from "fs/promises";
import { GraphSubject                       } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Identity                           } from "azure-devops-node-api/interfaces/IdentitiesInterfaces";
import { AzureDevOpsSecurityNamespaceAction } from "../models/AzureDevOpsSecurityNamespaceAction";
import { AzureDevOpsPortalLinks             } from "../../src/AzureDevOpsPortalLinks";
import { Helper                             } from "../../src/Helper";

test('AzureDevOpsHelper - gitRepositories-accessControlList', async () => {
    const config           = await TestConfigurationProvider.get();
    const organization     = config.azureDevOps.organization;
    const projectName      = config.azureDevOps.projectName;
    const tenantId         = config.azureDevOps.tenantId;
    const maxNumberOfTests = config.azureDevOps.maxNumberOfTests;
    const testName         = 'gitRepositories-accessControlList';

    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const gitRepositories = await azureDevOpsHelper.gitRepositories(organization, projectName);

    const securityNamespaceName = 'Git Repositories';
    const file = path.join(__dirname, 'out', `${testName}-${organization}-${projectName}-securityNamespace-${securityNamespaceName}.json`);
    await writeFile(file, 'test started');
    const securityNamespace = await azureDevOpsHelper.securityNamespaceByName(organization, securityNamespaceName);
    await writeFile(file, JSON.stringify({ organization, securityNamespaceName, securityNamespace }, null, 2));
    
    if (securityNamespace.namespaceId === undefined) { throw new Error(`securityNamespaceByName(${organization}, ${securityNamespaceName}).value.namespaceId === undefined`); }
    
    securityNamespace.actions.sort((a: AzureDevOpsSecurityNamespaceAction, b: AzureDevOpsSecurityNamespaceAction) => {
        // show these actions first
        const map = (value: string | undefined) => {
            if (value === 'Administer') { return `aaaa`; }
            if (value === 'Contribute') { return `aaab`; }
            if (value === 'Read'      ) { return `aaac`; }
            return `${value}`;
        };

        return map(a.displayName).localeCompare(map(b.displayName));
    });

    for (const gitRepository of gitRepositories.slice(0, maxNumberOfTests)) {
        const projectId    = gitRepository.project?.id; if (projectId    === undefined) { throw new Error("projectId === undefined"   ); }
        const repositoryId = gitRepository         .id; if (repositoryId === undefined) { throw new Error("repositoryId === undefined"); }
        const securityNamespaceId = securityNamespace.namespaceId;
        const includeExtendedInfo = true;

        const token = AzureDevOpsSecurityTokens.GitRepositories_Project_Repository(projectId, repositoryId);

        const file = path.join(__dirname, 'out', `${testName}-${organization}-${projectName}-${gitRepository.name}.md`);
        await writeFile(file, 'test started');

        const parameters = { organization, securityNamespaceId, token, includeExtendedInfo };
        const accessControlLists = await azureDevOpsHelper.accessControlLists(parameters);
        if (accessControlLists.length === 0) { throw new Error(JSON.stringify({ parameters, accessControlLists })) }

        const identityDescriptors = new Set<string>();

        for (const accessControlList of accessControlLists) {
            for (const key in accessControlList.acesDictionary) {
                const identity = accessControlList.acesDictionary[key];
                if (identity.descriptor === undefined) {
                    continue;
                }
                identityDescriptors.add(identity.descriptor);
            }
        }

        const identityDescriptorsArray = [...identityDescriptors].sort();

        const identities = await azureDevOpsHelper.identitiesByDescriptorExplicit(organization, identityDescriptorsArray);

        const subjectDescriptors = identities.filter(p => p.identity?.subjectDescriptor !== undefined).map(p => p.identity?.subjectDescriptor!);
        const graphSubjects = await azureDevOpsHelper.graphSubjectsLookup(organization, subjectDescriptors);
        const graphSubjectsArray = Helper.toArray(graphSubjects);

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
                                   : graphSubjectsArray.find(p => p.descriptor === identity.subjectDescriptor);


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

        const allActions = securityNamespace.actions.map(p => p.displayName);

        const lineBreak = "&#013;"
        const lines = new Array<string>();
        lines.push(`[${organization} / ${gitRepository.project?.name ?? gitRepository.project?.id} / ${gitRepository.name} Security Settings](${AzureDevOpsPortalLinks.repositorySettingsSecurity(organization, projectName, repositoryId)})`)
        lines.push(`|  |${allActions.map(p => `${p}|`).join('')}`);
        lines.push(`|:-|${allActions.map(p => ':-: |').join('')}`);
 
        for (const acl of accessControlListMappedActions) {
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
                else if (isAllow)          { line.push(`|Allow`); }
                else if (isDenyInherited)  { line.push(`|Deny` ); }
                else if (isDenyEffective)  { line.push(`|Deny` ); }
                else if (isDeny)           { line.push(`|Deny` ); }
                else                       { line.push(`|`     ); }
            }
            lines.push(line.join(''));
        }

        await writeFile(file, lines.join('\n'));
        
        console.log(file);
    }
}, 100000);
