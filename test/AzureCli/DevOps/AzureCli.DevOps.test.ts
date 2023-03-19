import { TestConfigurationProvider } from "../../_Configuration/TestConfiguration";
import { CommandRunner             } from "../../../src/CommandRunner";
test('AzureCli.DevOps.test', async () => {
    const config       = await TestConfigurationProvider.get();
    const organization = config.azureDevOps.organization;
    const baseUrl      = config.azureDevOps.baseUrl;
    const tenant       = config.azureDevOps.tenant;
    const projectName  = config.azureDevOps.projectName;
    const wiki         = '';
    const path         = '';

    // https://learn.microsoft.com/en-us/cli/azure/devops/wiki/page?view=azure-cli-latest#az-devops-wiki-page-show
    const command = `az devops wiki page show --organization ${baseUrl} --project ${projectName} --detect false --wiki ${wiki} --path "${path}"`;
    
    // https://learn.microsoft.com/en-us/azure/devops/project/wiki/manage-wikis?view=azure-devops#show-wiki
    //const command = `az devops wiki show --organization ${baseUrl} --project ${projectName} --wiki ${wiki}`;
 
    const { stdout, stderr } = await CommandRunner.run(command);

    console.log(command + '\n' + stdout+ '\n' + stderr);
}, 200000);