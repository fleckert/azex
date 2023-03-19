import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - graphMembershipAdd', async () => {
    const config                 = await TestConfigurationProvider.get();
    const organization           = config.azureDevOps.organization;
    const tenant                 = config.azureDevOps.tenant;
    const azureDevOpsHelper      = await AzureDevOpsHelper.instance(tenant);
    const containerPrincipalName = '';
    const memberPrincipalName    = '';
    
    if (`${containerPrincipalName}` !== '' && `${memberPrincipalName}` !== '') {
        const container = await azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, [        'Group'], containerPrincipalName);
        const member    = await azureDevOpsHelper.graphSubjectQueryByPrincipalName(organization, ['User', 'Group'], memberPrincipalName   );

        if (container?.descriptor === undefined) { throw new Error(JSON.stringify({ organization, container })); }
        if (member?.   descriptor === undefined) { throw new Error(JSON.stringify({ organization, member    })); }

        const graphMemberShip = await azureDevOpsHelper.graphMembershipAdd({ organization, subjectDescriptor: member.descriptor, containerDescriptor: container.descriptor });

        if (graphMemberShip === undefined) {
            throw new Error(JSON.stringify({ organization, containerPrincipalName, memberPrincipalName, graphMemberShip }));
        }
    }
}, 100000);