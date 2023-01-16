import { DefaultAzureCredential, TokenCredential } from "@azure/identity";


export class TestTokenCredentialProvider {
    static get(): TokenCredential {
        return new DefaultAzureCredential();;
    }
}
