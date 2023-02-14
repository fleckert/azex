import { ActiveDirectoryHelper                   } from "../../src/ActiveDirectoryHelper";
import { CommandRunner                           } from "../../src/CommandRunner";
import { DefaultAzureCredential, TokenCredential } from "@azure/identity";
import { readFile                                } from "fs/promises";
import { SubscriptionIdResolver                  } from "../../src/SubscriptionIdResolver";
import { TestHelper                              } from "../_TestHelper/TestHelper";
import path from "path";

export interface TestConfiguration {
    domain               : string;
    subscription         : string;
    userNames            : Array<string>;
    groupNames           : Array<string>;
    servicePrincipalNames: Array<string>;
    azureDevOps: {
        baseUrl     : string,
        organization: string,
        projectName : string
    },
    azureResources: {
        location: string,
        resourceGroupNames: Array<string>,
        rbacAssignments: [
            {
                resourceGroupName : string,
                principalType     : string,
                roleDefinitionName: string,
                name              : string
            }
        ]
    };
}

export class TestConfigurationProvider {
    static async get(): Promise<TestConfiguration> {

        const pathToConfigFile = path.join(__dirname, 'testconfig.a.json');
        const configRaw = await readFile(pathToConfigFile);
        const config = JSON.parse(configRaw.toString()) as TestConfiguration;

        config.domain       = await TestConfigurationProvider.getDomain        (config.domain      );
        config.subscription = await TestConfigurationProvider.getSubscriptionId(config.subscription);

        return config;
    }

    private static async getDomain(domain: string|undefined): Promise<string> {
        const errorMessage = 'Failed to resolve the value for \'domain\'. Set the \'domain\' property in the test-configuration file or login the Azure CLI as a user.';

        if (domain !== undefined && domain.trim().length > 0) {
            return domain;
        }

        const { item, error } = await CommandRunner.runAndParseJson<{ name: string, type: string }, string>('az account show --query user --output json');

        if (TestHelper.stringIsNullUndefinedOrEmpty(error) === false) { throw new Error(error); }

        if (item      === undefined           ) { throw new Error(errorMessage); }
        if (item.name === undefined           ) { throw new Error(errorMessage); }
        if (item.type.toLowerCase() !== 'user') { throw new Error(errorMessage); }

        const indexofAt = item.name.lastIndexOf('@');
        if (indexofAt < 0) { throw new Error(errorMessage); }

        return item.name.substring(indexofAt + 1);
    }

    private static async getSubscriptionId(subscription:string|undefined) : Promise<string> {
        const subscriptionId = await new SubscriptionIdResolver().getSubscriptionId(subscription);
        
        if (subscriptionId === undefined) { throw new Error("subscriptionId === undefined"); }

        return subscriptionId;
    }

    static getCredentials(): TokenCredential {
        return new DefaultAzureCredential();;
    }

    static getActiveDirectoryHelper(): ActiveDirectoryHelper {
        const credentials = TestConfigurationProvider.getCredentials();

        return new ActiveDirectoryHelper(credentials);
    }
}
