import   path                        from "path";
import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { AzureDevOpsWrapper        } from "../../src/AzureDevOpsWrapper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";
import { writeFile                 } from "fs/promises";
import { GraphGroup, GraphUser     } from "azure-devops-node-api/interfaces/GraphInterfaces";
import { Guid                      } from "../../src/Guid";
test('AzureDevOpsHelper - user-per-project-1', async () => {

    const config = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const baseUrl = config.azureDevOps.baseUrl;
    const azureDevOpsHelper = new AzureDevOpsHelper();
    const token = await azureDevOpsHelper.getPersonalAccessToken();
    const azureDevOpsWrapper = new AzureDevOpsWrapper(baseUrl, token);

    const maxNumerOfTests = 500;


}, 100000);