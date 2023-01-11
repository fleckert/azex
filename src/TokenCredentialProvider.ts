import { AccessToken, DefaultAzureCredential, DeviceCodeCredential, GetTokenOptions, TokenCredential } from "@azure/identity";

export class TokenCredentialProvider {
    static get(): TokenCredential {
        const clientId = 'a54fd18c-99ca-4cb3-9356-aa29f42897b4';

        const credential = new TryCatchedChainedTokenCredential([
            new DefaultAzureCredential(),
            new DeviceCodeCredential({ clientId })
        ]);
        return credential;
    }
}

class TryCatchedChainedTokenCredential implements TokenCredential {

    constructor(
        readonly credentials: Array<TokenCredential>
    ) { }

    async getToken(scopes: string | string[], options?: GetTokenOptions): Promise<AccessToken | null> {
        for (const credential of this.credentials) {
            try {
                const accessToken = await credential.getToken(scopes, options);

                return accessToken;
            }
            catch { }
        }
        return null;
    }
}