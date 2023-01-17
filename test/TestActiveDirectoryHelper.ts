import { ActiveDirectoryHelper       } from "../src/ActiveDirectoryHelper";
import { TestTokenCredentialProvider } from "./TestTokenCredentialProvider";

export class TestActiveDirectoryHelper {
    static get(): ActiveDirectoryHelper {
        const credential = TestTokenCredentialProvider.get();

        return new ActiveDirectoryHelper(credential);
    }
}