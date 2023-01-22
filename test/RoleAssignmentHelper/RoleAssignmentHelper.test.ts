import { RoleAssignmentHelper } from "../../src/RoleAssignmentHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { TestHelper             } from "../_TestHelper/TestHelper";

test('SubscriptionIdResolver \'undefined\'', async () => {
    const credentials = TestConfigurationProvider.getCredentials();
    const config      = await TestConfigurationProvider.get();
   
    const roleAssignments = await new RoleAssignmentHelper(credentials, config.subscription).listAllForScope(`/subscriptions/${config.subscription}`)
    
    if(roleAssignments === null){
        throw new Error('roleAssignments === null')
    }

    if(roleAssignments === undefined){
        throw new Error('roleAssignments === undefined')
    }

    if(roleAssignments.length === 0){
        throw new Error('roleAssignments.length === 0')
    }
}, 100000);