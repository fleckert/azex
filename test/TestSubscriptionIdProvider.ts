import { SubscriptionIdResolver    } from "../src/SubscriptionIdResolver";
import { TestConfigurationProvider } from "./TestConfigurationProvider";


export class TestSubscriptionIdProvider {
    static async getSubscriptionId() : Promise<string> {
        const config = await TestConfigurationProvider.get();

        const subscriptionId = await new SubscriptionIdResolver().getSubscriptionId(config.subscription);
        
        if (subscriptionId === undefined) { throw new Error("subscriptionId === undefined"); }

        return subscriptionId;
    }
}
