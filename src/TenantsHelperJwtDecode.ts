import { TokenCredential } from "@azure/identity";
import jwt_decode from "jwt-decode";


export class TenantsHelperJwtDecode {
    constructor(readonly credential: TokenCredential) { }

    async getTenantId(): Promise<string | undefined> {
        const token = await this.credential.getToken("https://management.azure.com");
        
        if(token === null)
        {
            return undefined;
        }

        var decoded : Token = jwt_decode(token.token);

        return decoded.tid;
    }
}

interface Token{
    tid: string;
}
