import { DefaultAzureCredential } from "@azure/identity";
import { ActiveDirectoryHelper } from "../src/ActiveDirectoryHelper";

export class TestActiveDirectoryHelper {
    static get(): ActiveDirectoryHelper {
        return new ActiveDirectoryHelper(new DefaultAzureCredential());
    }
}