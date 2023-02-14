import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";
import { TestHelper                } from "../_TestHelper/TestHelper";

const accessControlListsTest = async (azureDevOpsHelper: AzureDevOpsHelper, parameters: {
    organization: string,
    securityNamespaceId: string,
    token?: string,
    descriptors?: Array<string>,
    includeExtendedInfo?: boolean,
    recurse?: boolean
}): Promise<void> => {

    const accessControlLists = await azureDevOpsHelper.accessControlLists(parameters);
    TestHelper.checkValueAndError(accessControlLists, parameters);

    const maxNumerOfTests = 5;

    for (const accessControlList of accessControlLists.value!.slice(0, maxNumerOfTests)) {
        parameters.token = accessControlList.token!;
        const accessControlListsItem = await azureDevOpsHelper.accessControlLists(parameters);
        TestHelper.checkValueAndError(accessControlListsItem, parameters);
    }

    for (const accessControlList of accessControlLists.value!.slice(0, maxNumerOfTests)) {
        parameters.token = undefined;
        parameters.descriptors = new Array<string>();
        for (const key in accessControlList.acesDictionary) {
            parameters.descriptors.push(key);
        }
        const accessControlListsItem = await azureDevOpsHelper.accessControlLists(parameters);
        TestHelper.checkValueAndError(accessControlListsItem, parameters);
    }
}

test('AzureDevOpsHelper - accessControlLists', async () => {
    const config = await TestConfigurationProvider.get();
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const organization = config.azureDevOps.organization;
    const testDir = 'out';
    const testName ='accessControlLists';

    await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-securityNamespaces.json`), JSON.stringify({ message: 'test started' }, null, 2));
    const securityNamespaces = await azureDevOpsHelper.securityNamespaces(organization);
    await writeFile(path.join(__dirname, testDir, `${testName}-${organization}-securityNamespaces.json`), JSON.stringify(securityNamespaces, null, 2));
    TestHelper.checkValueAndError(securityNamespaces, { organization });

    const maxNumerOfTests = 5;

    for (const securityNamespace of securityNamespaces.value!.filter(p => p.namespaceId !== undefined).slice(0, maxNumerOfTests)) {
        const securityNamespaceId = securityNamespace.namespaceId!;

        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: undefined, recurse: undefined });
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: undefined, recurse: false     });
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: undefined, recurse: true      });
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: false    , recurse: undefined });
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: false    , recurse: false     });
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: false    , recurse: true      });
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: true     , recurse: undefined });
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: true     , recurse: false     });
        await accessControlListsTest(azureDevOpsHelper, { organization, securityNamespaceId, includeExtendedInfo: true     , recurse: true      });
    }
}, 200000);