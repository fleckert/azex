import { readFile } from "fs/promises";
import path from "path";
import { TestConfiguration } from "./TestConfiguration";

export class TestConfigurationProvider {
    static async get(): Promise<TestConfiguration> {

        const pathToConfigFile = path.join(__dirname, 'testconfig.a.json');
        const configRaw = await readFile(pathToConfigFile);
        const config = JSON.parse(configRaw.toString()) as TestConfiguration;

        return config;
    }
}

