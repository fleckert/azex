import   path                        from "path";
import { AzureDevOpsHelper         } from "../../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../../_Configuration/TestConfiguration";
import { mkdir, rm, writeFile      } from "fs/promises";

test('AzureDevOpsHelper - accessControlLists', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenantId          = config.azureDevOps.tenantId;
    const maxNumberOfTests  = config.azureDevOps.maxNumberOfTests;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

    await mkdir(path.join(__dirname, 'out'));
    const file = path.join(__dirname, 'out', `${organization}-securityNamespaces.json`)
    await rm(file, { force: true });
    const securityNamespaces = await azureDevOpsHelper.securityNamespaces(organization);
    await writeFile(file, JSON.stringify(securityNamespaces, null, 2));

    for (const securityNamespace of securityNamespaces.filter(p => p.namespaceId !== undefined).slice(0, maxNumberOfTests)) {
        const securityNamespaceId = securityNamespace.namespaceId!;

        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: undefined, recurse: undefined }, maxNumberOfTests);
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: undefined, recurse: false     }, maxNumberOfTests);
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: undefined, recurse: true      }, maxNumberOfTests);
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: false    , recurse: undefined }, maxNumberOfTests);
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: false    , recurse: false     }, maxNumberOfTests);
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: false    , recurse: true      }, maxNumberOfTests);
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: true     , recurse: undefined }, maxNumberOfTests);
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: true     , recurse: false     }, maxNumberOfTests);
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: true     , recurse: true      }, maxNumberOfTests);
    }
}, 200000);

const accessControlListsTest = async (azureDevOpsHelper: AzureDevOpsHelper, parameters: {
    organization        : string,
    securityNamespaceId : string,
    token?              : string,
    descriptors?        : Array<string>,
    includeExtendedInfo?: boolean,
    recurse?            : boolean
}, maxNumberOfTests: number): Promise<void> => {

    const accessControlLists = await azureDevOpsHelper.accessControlLists(parameters);

    for (const accessControlList of accessControlLists.slice(0, maxNumberOfTests)) {
        parameters.token = accessControlList.token!;
        const accessControlListsItem = await azureDevOpsHelper.accessControlLists(parameters);
    }

    for (const accessControlList of accessControlLists.slice(0, maxNumberOfTests)) {
        parameters.token = undefined;
        parameters.descriptors = new Array<string>();
        for (const key in accessControlList.acesDictionary) {
            parameters.descriptors.push(key);
        }
        const accessControlListsItem = await azureDevOpsHelper.accessControlLists(parameters);
    }
}