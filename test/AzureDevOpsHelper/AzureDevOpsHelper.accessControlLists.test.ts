import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";

const accessControlListsTest = async (azureDevOpsHelper: AzureDevOpsHelper, parameters: {
    organization: string,
    securityNamespaceId: string,
    token?: string,
    descriptors?: Array<string>,
    includeExtendedInfo?: boolean,
    recurse?: boolean
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

test('AzureDevOpsHelper - accessControlLists', async () => {
    const config            = await TestConfigurationProvider.get();
    const organization      = config.azureDevOps.organization;
    const tenantId          = config.azureDevOps.tenantId;
    const maxNumberOfTests  = config.azureDevOps.maxNumberOfTests;
    const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);
    const testDir           = 'out';
    const testName          ='accessControlLists';

    await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-securityNamespaces.json`), JSON.stringify({ message: 'test started' }, null, 2));
    const securityNamespaces = await azureDevOpsHelper.securityNamespaces(organization);
    await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-securityNamespaces.json`), JSON.stringify(securityNamespaces, null, 2));

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