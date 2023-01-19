import { readFile } from "fs/promises";
import path from "path";
import { CommandRunner } from "../src/CommandRunner";
import { TestConfiguration } from "./TestConfiguration";
import { TestHelper } from "./TestHelper";

export class TestConfigurationProvider {
    static async get(): Promise<TestConfiguration> {

        const pathToConfigFile = path.join(__dirname, 'testconfig.a.json');
        const configRaw = await readFile(pathToConfigFile);
        const config = JSON.parse(configRaw.toString()) as TestConfiguration;

        if(TestHelper.stringIsNullUndefinedOrEmpty(config.domain)){
            config.domain = await TestConfigurationProvider.getDomain();
        }

        return config;
    }

    private static async getDomain(): Promise<string> {
        const errorMessage = 'Failed to resolve the value for \'domain\'. Set the \'domain\' property in the test-configuration file or login the Azure CLI as a user.';

        const { item, error } = await CommandRunner.runAndParseJson<{ name: string, type: string }, string>('az account show --query user --output json');

        if (TestHelper.stringIsNullUndefinedOrEmpty(error) === false) { throw new Error(error); }

        if (item      === undefined           ) { throw new Error(errorMessage); }
        if (item.name === undefined           ) { throw new Error(errorMessage); }
        if (item.type.toLowerCase() !== 'user') { throw new Error(errorMessage); }

        const indexofAt = item.name.lastIndexOf('@');
        if (indexofAt < 0) { throw new Error(errorMessage); }

        const domain = item.name.substring(indexofAt + 1);

        return domain;
    }
}

