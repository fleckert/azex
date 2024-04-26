import { AzureResourceIdSlim } from "../../src/AzureResourceIdSlim";

test('AzureResourceId-0', () => {
    const id = '/';
    const expected : ExpectedAzureResourceId= {
        id                 : id,
        managementGroupName: undefined,
        managementGroupId  : undefined,
        subscriptionId     : undefined,
        resourceGroupName  : undefined,
        provider           : undefined,
        resource           : undefined,
        isValid            : true
    }; 

   validate(id, expected);
 });

test('AzureResourceId-1', () => {
    const id = '/providers/Microsoft.Management/managementGroups/00000000-0000-0000-0000-000000000000';
    const expected : ExpectedAzureResourceId= {
        id                 : id,
        managementGroupName: undefined,
        managementGroupId  : '00000000-0000-0000-0000-000000000000',
        subscriptionId     : undefined,
        resourceGroupName  : undefined,
        provider           : undefined,
        resource           : undefined,
        isValid            : true
    }; 

   validate(id, expected);
 });

test('AzureResourceId-2', () => {
    const id = '/providers/Microsoft.Management/managementGroups/someName';
    const expected : ExpectedAzureResourceId = {
        id                 : id,
        managementGroupName: 'someName',
        managementGroupId  : undefined,
        subscriptionId     : undefined,
        resourceGroupName  : undefined,
        provider           : undefined,
        resource           : undefined,
        isValid            : true
    }; 

   validate(id, expected);
});

test('AzureResourceId-3', () => {
    const id = '/subscriptions/00000000-0000-0000-0000-000000000000';
    const expected : ExpectedAzureResourceId = {
        id                 : id,
        managementGroupName: undefined,
        managementGroupId  : undefined,
        subscriptionId     : '00000000-0000-0000-0000-000000000000',
        resourceGroupName  : undefined,
        provider           : undefined,
        resource           : undefined,
        isValid            : true
    }; 

   validate(id, expected);
});

test('AzureResourceId-4', () => {
    const id  = '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-name';
    const expected : ExpectedAzureResourceId = {
        id                 : id,
        managementGroupName: undefined,
        managementGroupId  : undefined,
        subscriptionId     : '00000000-0000-0000-0000-000000000000',
        resourceGroupName  : 'rg-name',
        provider           : undefined,
        resource           : undefined,
        isValid            : true
    }; 

   validate(id, expected);
});

test('AzureResourceId-5', () => {
    const id = '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-name/providers/Microsoft.CognitiveServices/accounts/accountName';
    const expected : ExpectedAzureResourceId = {
        id                 : id,
        managementGroupName: undefined,
        managementGroupId  : undefined,
        subscriptionId     : '00000000-0000-0000-0000-000000000000',
        resourceGroupName  : 'rg-name',
        provider           : 'Microsoft.CognitiveServices/accounts',
        resource           : 'accountName',
        isValid            : true
    }; 

   validate(id, expected);
});

test('AzureResourceId-6', () => {
    const id  =  '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-name/providers/Microsoft.Storage/storageAccounts/accountName/blobServices/default/containers/containerName';
    const expected : ExpectedAzureResourceId = {
        id                 : id,
        managementGroupName: undefined,
        managementGroupId  : undefined,
        subscriptionId     : '00000000-0000-0000-0000-000000000000',
        resourceGroupName  : 'rg-name',
        provider           : 'Microsoft.Storage/storageAccounts',
        resource           : 'accountName/blobServices/default/containers/containerName',
        isValid            : true
    }; 

   validate(id, expected);
});

interface ExpectedAzureResourceId {

    id                 : string;
    managementGroupName: string | undefined;
    managementGroupId  : string | undefined;
    subscriptionId     : string | undefined;
    resourceGroupName  : string | undefined;
    provider           : string | undefined;
    resource           : string | undefined;
    isValid            : boolean;
 }

function validate (id: string, expected: ExpectedAzureResourceId ){
    const azureResourceId = new AzureResourceIdSlim(id);

    expect(azureResourceId.managementGroupName).toBe(expected.managementGroupName);
    expect(azureResourceId.managementGroupId  ).toBe(expected.managementGroupId  );
    expect(azureResourceId.subscriptionId     ).toBe(expected.subscriptionId     );
    expect(azureResourceId.resourceGroupName  ).toBe(expected.resourceGroupName  );
    expect(azureResourceId.provider           ).toBe(expected.provider           );
    expect(azureResourceId.resource           ).toBe(expected.resource           );
    expect(azureResourceId.isValid            ).toBe(expected.isValid            );
    expect(azureResourceId.id                 ).toBe(expected.id                 );
}
