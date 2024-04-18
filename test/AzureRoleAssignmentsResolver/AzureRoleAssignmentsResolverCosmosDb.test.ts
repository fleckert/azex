import { AzureRoleAssignmentsConverter        } from "../../src/AzureRoleAssignmentsConverter";
import { AzureRoleAssignmentsResolver         } from "../../src/AzureRoleAssignmentsResolver";
import { CommandRunner                        } from "../../src/CommandRunner";
import { RbacDefinition, RbacDefinitionHelper } from "../../src/models/RbacDefinition";
import { AzureRoleAssignmentsResolverCosmosDb } from "../../src/AzureRoleAssignmentsResolverCosmosDb";
import { TestConfigurationProvider            } from "../_Configuration/TestConfiguration";
import { TestHelper                           } from "../_TestHelper/TestHelper";

test('AzureRoleAssignmentsResolverCosmosDb', async () => {
    const credentials = TestConfigurationProvider.getCredentials();
    const config = await TestConfigurationProvider.get();

    const promiseAzureRoleAssignmentsResolver =   await new AzureRoleAssignmentsResolverCosmosDb().resolve(credentials, config.subscription);
   
    // const { item: rbacDefinitionsFromAzureCli, error: errorAzureCli } = await promiseAzureCli;
    // const { roleAssignments, failedRequests                         } = await promiseAzureRoleAssignmentsResolver;

    // const rbacDefinitions = new AzureRoleAssignmentsConverter().mapExtendend(roleAssignments);

    // if (rbacDefinitionsFromAzureCli === undefined) { throw new Error("rbacDefinitionsFromAzureCli === undefined"); }

    // // the Azure Cli uses the appId for the principalName for servicePrincipals for managedIdentities, therefore, just compare the ids
    // const collectionsMatch = TestHelper.checkForCorrespondingElements(rbacDefinitions, rbacDefinitionsFromAzureCli, RbacDefinitionHelper.isEqualCaseInsensitiveIds);

    // if (collectionsMatch !== true) {
    //     const { itemsInAandNotInB, itemsInBandNotInA } = TestHelper.getMissingElements(rbacDefinitions, rbacDefinitionsFromAzureCli, RbacDefinitionHelper.isEqualCaseInsensitiveIds);

    //     throw new Error(JSON.stringify(`Collections do not match. ${JSON.stringify({ rbacDefinitions, rbacDefinitionsFromAzureCli }, null, 2)}`));
    // }
}, 100000);
