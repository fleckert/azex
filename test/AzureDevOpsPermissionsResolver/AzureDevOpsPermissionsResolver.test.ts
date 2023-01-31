import { AzureDevOpsPermissionsResolver } from "../../src/AzureDevOpsPermissionsResolver";

test('AzureDevOpsPermissionsResolver', async () => {
    const organization = 'mylseg' ?? 'fleckert-msft';
    const projectName = 'foundation';

    const { error } = await new AzureDevOpsPermissionsResolver().resolve(organization, projectName);

    if (error !== undefined) { throw error; }
}, 100000);
