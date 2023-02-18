import { AzureDevOpsHelper         } from "../../src/AzureDevOpsHelper";
import { TestConfigurationProvider } from "../_Configuration/TestConfiguration";

test('AzureDevOpsHelper - identities-collection', async () => {
  const config       = await TestConfigurationProvider.get();
  const organization = config.azureDevOps.organization;
  const tenantId     = config.azureDevOps.tenantId;

  const azureDevOpsHelper = await AzureDevOpsHelper.instance(tenantId);

  const identityDescriptors = [
    // 'Microsoft.TeamFoundation.Identity;S-1-9-1551374245-1204400969-2402986413-2179408616-0-0-0-0-1',
    // 'Microsoft.TeamFoundation.Identity;S-1-9-1551374245-940603067-1119015245-3220409856-822308278-0-0-0-0-1',
    // 'Microsoft.TeamFoundation.Identity;S-1-9-1551374245-1204400969-2402986413-2179408616-0-0-0-0-2',
    // 'Microsoft.TeamFoundation.Identity;S-1-9-1551374245-1204400969-2402986413-2179408616-0-0-0-1-1',
    // 'Microsoft.TeamFoundation.Identity;S-1-9-1551374245-1359107789-4185972047-2433178766-847314752-0-0-0-0-1',
    // 'Microsoft.TeamFoundation.Identity;S-1-9-1551374245-1359107789-4185972047-2433178766-847314752-0-0-0-1-2',
    // 'Microsoft.TeamFoundation.Identity;S-1-9-1551374245-1434794027-3054936394-2525328446-1989691225-1-3620456700-2119203912-2518711490-34110015',
    'Microsoft.TeamFoundation.ServiceIdentity;3f5e5d6f-ed51-4f17-9b3e-edf961406c83:Build:2b388555-16b6-4aa1-9685-743e76984759'
  ];

  const identities = await azureDevOpsHelper.identitiesByDescriptorExplicit(organization, identityDescriptors);

  for (const identityDescriptor of identityDescriptors) {
    const identity = identities.find(p => p.identityDescriptor === identityDescriptor)?.identity;

    if (identity === undefined) {
      throw new Error(`Failed to resolve identity ${JSON.stringify({ identityDescriptor, identities }, null, 2)}.`);
    }

    if (identity.descriptor === undefined) {
      throw new Error(`Failed to resolve identity.descriptor ${JSON.stringify({ identityDescriptor, identity }, null, 2)}.`);
    }

    const graphMember = await azureDevOpsHelper.graphMemberFromIdentity(organization, `${identity.descriptor}`);

    // if(graphMember === undefined)
    // {
    //   throw new Error(JSON.stringify({organization, identityDescriptor, identity}));
    // }

    console.log({ identityDescriptor, graphMember: graphMember?.principalName });
  }
}, 100000);